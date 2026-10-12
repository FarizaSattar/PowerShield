# PowerShield Backend

Isolated-lab SCADA/OT monitoring backend with simulated substation traffic, event storage, and anomaly detection.

## Quick start
```bash
python -m venv .venv
pip install -r requirements.txt
python simulator/traffic_generator.py
```
In another terminal:
```bash
python -m app.ingest_jsonl
```
In another:
```bash
python -m app.api
```

API runs on port 5001.

## Zeek / Suricata integration
The ingestion layer is intentionally normalized around JSON events. For a lab deployment, add adapters that parse:
- Zeek JSON/TSV logs
- Suricata EVE JSON

Only use this in an authorized, isolated environment.
