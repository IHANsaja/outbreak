import time
import pytz
import shutil
import os
import atexit
from datetime import datetime, timedelta
from apscheduler.schedulers.blocking import BlockingScheduler
from pipeline_core import DMCPipeline
from api_client import APIClient
import logging

logger = logging.getLogger(__name__)

# Config
SL_TZ = pytz.timezone('Asia/Colombo')
DOWNLOADS_DIR = "../dmc_downloads"

def cleanup():
    """Removes the downloads directory when the process stops."""
    if os.path.exists(DOWNLOADS_DIR):
        logger.info(f"Cleaning up {DOWNLOADS_DIR}...")
        try:
            shutil.rmtree(DOWNLOADS_DIR)
            logger.info("Cleanup successful.")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")

# Register cleanup on exit
atexit.register(cleanup)

def run_pipeline():
    logger.info("--- Triggering Scheduled DMC Extraction ---")
    try:
        pipeline = DMCPipeline(downloads_dir=DOWNLOADS_DIR)
        api = APIClient()
        
        # 1. Run Scraper and Extractor
        new_data = pipeline.run_cycle()
        
        if new_data:
            # 2. Feed to AI Models
            api.update_and_send(new_data)
            logger.info(f"Pipeline successfully processed {len(new_data)} data points.")
        else:
            logger.info("No new reports found on DMC website.")
            
    except Exception as e:
        logger.error(f"Critical Pipeline Failure: {e}", exc_info=True)

def start_scheduler():
    scheduler = BlockingScheduler(timezone=SL_TZ)
    
    # DMC typically uploads every 3 hours starting from 0:30
    # We add a 5-minute buffer to ensure the file is actually there
    hours = "0,3,6,9,12,15,18,21"
    
    scheduler.add_job(
        run_pipeline, 
        'cron', 
        hour=hours, 
        minute=35, 
        id='dmc_sync'
    )
    
    logger.info(f"Scheduler started. Next syncs at {hours} (minutes: 35) SL Time.")
    
    # Check if run once flag is passed
    import sys
    if "--once" in sys.argv:
        run_pipeline()
    else:
        # Run immediately on startup to catch anything we missed
        run_pipeline()
        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            logger.info("Scheduler stopping...")
            pass

if __name__ == "__main__":
    start_scheduler()
