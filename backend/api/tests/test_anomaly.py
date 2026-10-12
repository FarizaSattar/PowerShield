from detection.anomaly import score_events

def test_small_dataset():
    result = score_events([{"bytes":100,"src_port":1,"dst_port":2}])
    assert result[0]["anomaly_score"] == 0.0
