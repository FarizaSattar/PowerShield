CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    src_ip TEXT,
    dst_ip TEXT,
    protocol TEXT,
    src_port INTEGER,
    dst_port INTEGER,
    bytes INTEGER,
    event_type TEXT,
    severity TEXT,
    anomaly_score REAL,
    status TEXT DEFAULT 'Open'
);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON security_events(timestamp);
