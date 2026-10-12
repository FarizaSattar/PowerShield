import json, time
from pathlib import Path
from app.db import insert_event, init_db

FILE = Path("data/events.jsonl")
init_db()
seen = 0

print("Watching", FILE)
while True:
    if FILE.exists():
        lines = FILE.read_text().splitlines()
        for line in lines[seen:]:
            try:
                insert_event(json.loads(line))
            except Exception as exc:
                print("ingestion error:", exc)
            seen += 1
    time.sleep(1)
