import os
import requests
from bs4 import BeautifulSoup
import re
import pdfplumber
import pandas as pd
import json
import time
import datetime as dt
import pytz
import logging
from pathlib import Path
from urllib.parse import urljoin
import easyocr
import numpy as np

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("pipeline.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DMCPipeline:
    def __init__(self, 
                 base_url="https://www.dmc.gov.lk",
                 list_url=None,
                 downloads_dir="downloads",
                 state_file="pipeline_state.json",
                 mapping_path="../data/water_levels_global_ml_mapping.csv"):
        
        self.base_url = base_url
        # Limit to 20 reports and focus on report_type_id=6 (Water Level)
        self.list_url = list_url or (base_url + "/index.php?Itemid=277&lang=en&option=com_dmcreports&report_type_id=6&view=reports&limit=20")
        self.downloads_dir = Path(downloads_dir)
        self.downloads_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = Path(state_file)
        self.mapping_path = Path(mapping_path)
        
        self.processed_urls = self._load_state()
        self.mapping_df = pd.read_csv(self.mapping_path)
        self.reader = None # Lazy load EasyOCR

    def _load_state(self):
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return set(json.load(f))
        return set()

    def _save_state(self):
        with open(self.state_file, 'w') as f:
            json.dump(list(self.processed_urls), f)

    def get_latest_report_urls(self):
        logger.info(f"Fetching report list from {self.list_url}")
        try:
            resp = requests.get(self.list_url, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            
            urls = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                # Filter for relevant report paths and SKIP notice reports or generic alerts
                if "/images/dmcreports/" in href.lower():
                    # Optimization: Only include "Water Level" or specific hour reports
                    is_wl_report = any(kw in href.lower() for kw in ["water", "hrs", "level"])
                    if is_wl_report:
                        url = urljoin(self.base_url, href)
                        if url not in self.processed_urls:
                            urls.append(url)
            
            # Return latest ones first
            return list(reversed(urls[-10:])) # Max 10 per cycle for performance
        except Exception as e:
            logger.error(f"Failed to fetch report list: {e}")
            return []

    def download_report(self, url):
        filename = url.split("/")[-1].split("?")[0]
        dest = self.downloads_dir / filename
        logger.info(f"Downloading {url} to {dest}")
        try:
            resp = requests.get(url, stream=True, timeout=60)
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            return dest
        except Exception as e:
            logger.error(f"Download failed for {url}: {e}")
            return None

    def extract_data_hybrid(self, file_path):
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            data = self._parse_pdf_text(file_path)
            if not data:
                logger.info(f"Text extraction empty. Falling back to OCR for {file_path.name}")
                data = self._parse_image_ocr(file_path) 
            return data
        elif ext in [".jpg", ".jpeg", ".png"]:
            return self._parse_image_ocr(file_path)
        return []

    def _parse_pdf_text(self, file_path):
        data = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if len(row) < 9: continue
                            row = [str(c).replace("\n", " ").strip() if c else "" for c in row]
                            if not any(u in row for u in ["m", "ft", "Rising", "Falling"]): continue
                            
                            try:
                                extracted = {
                                    "river": row[1],
                                    "station": row[2],
                                    "alert_level": self._safe_float(row[4]),
                                    "minor_flood": self._safe_float(row[5]),
                                    "major_flood": self._safe_float(row[6]),
                                    "water_level_now": self._safe_float(row[8]),
                                    "water_level_lag1": self._safe_float(row[7]),
                                    "rainfall": self._safe_float(row[11]) if len(row) > 11 else 0.0
                                }
                                # Basic validation
                                if extracted['station'] and extracted['water_level_now'] > 0:
                                    data.append(extracted)
                            except:
                                continue
            return data
        except Exception as e:
            logger.error(f"PDF text parse failed: {e}")
            return []

    def _parse_image_ocr(self, file_path):
        if not self.reader:
            logger.info("Initializing EasyOCR (CPU)...")
            self.reader = easyocr.Reader(['en'], gpu=False)
        
        try:
            results = self.reader.readtext(str(file_path))
            lines = {}
            for (bbox, text, prob) in results:
                y_center = (bbox[0][1] + bbox[2][1]) / 2
                added = False
                for ly in lines.keys():
                    if abs(ly - y_center) < 20:
                        lines[ly].append((bbox[0][0], text))
                        added = True
                        break
                if not added:
                    lines[y_center] = [(bbox[0][0], text)]

            data = []
            for y in sorted(lines.keys()):
                line_text = " ".join([txt for x, txt in sorted(lines[y])])
                if re.search(r"\d+\.\d+", line_text):
                    tokens = [t for t in line_text.split() if t]
                    if len(tokens) >= 4:
                        nums = [self._safe_float(t) for t in tokens if re.search(r"\d", t)]
                        if len(nums) >= 2:
                            data.append({
                                "river": tokens[0],
                                "station": tokens[1] if len(tokens) > 1 else "",
                                "water_level_now": nums[-1] if nums else 0,
                                "water_level_lag1": nums[-2] if len(nums) > 1 else 0,
                                "alert_level": nums[0] if nums else 0,
                                "minor_flood": 0,
                                "major_flood": 0,
                                "rainfall": 0
                            })
            return data
        except Exception as e:
            logger.error(f"OCR failed for {file_path.name}: {e}")
            return []

    def _safe_float(self, val):
        if not val or val in ["NA", "-", "N.A."]: return 0.0
        try:
            return float(re.sub(r"[^\d.]", "", str(val)))
        except:
            return 0.0

    def map_to_ids(self, data):
        mapped_data = []
        for row in data:
            station_name = row['station'].lower()
            match = self.mapping_df[self.mapping_df['station'].str.lower().str.contains(station_name, na=False)]
            if not match.empty:
                row['station_id'] = int(match.iloc[0]['station_id'])
                row['river_id'] = int(match.iloc[0]['river_id'])
                mapped_data.append(row)
        return mapped_data

    def run_cycle(self):
        new_urls = self.get_latest_report_urls()
        results = []
        for url in new_urls:
            file_path = self.download_report(url)
            if file_path:
                extracted = self.extract_data_hybrid(file_path)
                mapped = self.map_to_ids(extracted)
                results.extend(mapped)
                self.processed_urls.add(url)
                self._save_state()
            time.sleep(1)
        return results
