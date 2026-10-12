import pandas as pd
from sklearn.ensemble import IsolationForest

FEATURES = ["bytes", "src_port", "dst_port"]

def score_events(events):
    if not events:
        return []
    df = pd.DataFrame(events).copy()
    for col in FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    if len(df) < 5:
        df["anomaly_score"] = 0.0
        return df.to_dict("records")

    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(df[FEATURES])
    raw = -model.score_samples(df[FEATURES])
    df["anomaly_score"] = raw.round(4)
    df["severity"] = pd.cut(
        df["anomaly_score"],
        bins=[-float("inf"), .45, .60, float("inf")],
        labels=["LOW", "MEDIUM", "HIGH"]
    ).astype(str)
    return df.to_dict("records")
