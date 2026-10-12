import os, sqlite3
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

DB = Path(os.getenv("POWERSHIELD_DB", "./data/powershield.db"))
DB.parent.mkdir(parents=True, exist_ok=True)

def conn():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    schema = Path(__file__).resolve().parents[1] / "database/schema.sql"
    with conn() as c:
        c.executescript(schema.read_text())

def insert_event(e):
    with conn() as c:
        c.execute("""
        INSERT INTO security_events
        (timestamp,src_ip,dst_ip,protocol,src_port,dst_port,bytes,event_type,severity,anomaly_score,status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (e["timestamp"],e.get("src_ip"),e.get("dst_ip"),e.get("protocol"),
              e.get("src_port"),e.get("dst_port"),e.get("bytes",0),e.get("event_type"),
              e.get("severity","LOW"),e.get("anomaly_score",0),e.get("status","Open")))

def recent_events(limit=100):
    with conn() as c:
        rows = c.execute("SELECT * FROM security_events ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]
