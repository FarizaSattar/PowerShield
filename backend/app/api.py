from flask import Flask, jsonify, request
from flask_cors import CORS
from app.db import init_db, recent_events, insert_event

app = Flask(__name__)
CORS(app)
init_db()

@app.get("/api/health")
def health():
    return jsonify({"status":"ok","service":"PowerShield","monitoring":True})

@app.get("/api/events")
def events():
    return jsonify(recent_events(min(int(request.args.get("limit",100)),1000)))

@app.get("/api/overview")
def overview():
    events = recent_events(1000)
    high = sum(e["severity"] == "HIGH" for e in events)
    open_count = sum(e["status"] != "Resolved" for e in events)
    return jsonify({
        "risk_score": min(100, 20 + high*12 + open_count*3),
        "open_alerts": open_count,
        "high_severity": high,
        "ot_devices": 18,
        "monitoring": True
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
