import random, time, json
from datetime import datetime, timezone
from pathlib import Path

OUT = Path("data/events.jsonl")
OUT.parent.mkdir(exist_ok=True)

devices = ["10.0.1.10","10.0.1.11","10.0.1.12","10.0.2.17","10.0.2.44","10.0.2.51"]
protocols = ["TCP","UDP","ICMP"]

def event():
    abnormal = random.random() < .08
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "src_ip": random.choice(devices),
        "dst_ip": random.choice(devices[:3]),
        "protocol": random.choice(protocols),
        "src_port": random.randint(1024,65535),
        "dst_port": random.choice([80,443,502,2404,4840]),
        "bytes": random.randint(5000,50000) if not abnormal else random.randint(150000,500000),
        "event_type": "abnormal_packet_rate" if abnormal else "normal_traffic",
        "severity": "HIGH" if abnormal else "LOW",
        "anomaly_score": 0
    }

print("PowerShield traffic simulator running...")
try:
    while True:
        e = event()
        with OUT.open("a") as f:
            f.write(json.dumps(e)+"\n")
        print(e)
        time.sleep(1)
except KeyboardInterrupt:
    pass
