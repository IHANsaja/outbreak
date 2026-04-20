from pipeline_core import DMCPipeline

p = DMCPipeline()
p.processed_urls.clear()
urls = p.get_latest_report_urls()
if urls:
    print('Testing on:', urls[-1])
    f = p.download_report(urls[-1])
    extracted = p.extract_data_hybrid(f)
    print(f'Extracted {len(extracted)} raw records')
    mapped = p.map_to_ids(extracted)
    print(f'Successfully mapped {len(mapped)} records to IDs')
    for m in mapped:
        print(f'- {m.get("station_id")} ({m.get("station")})')
else:
    print('No URLs found')
