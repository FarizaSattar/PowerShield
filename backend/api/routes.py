"""
PowerShield REST API routes.

The API subscribes to MQTT telemetry and exposes the latest
device state and security alerts to the React frontend.
"""

from __future__ import annotations

import json
import threading
from collections import deque
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt
from flask import Blueprint, jsonify, request

from backend.attacks.false_data_injection import (
    create_false_data_injection,
)
from backend.config.settings import (
    DEVICES,
    MQTT_ALERT_TOPIC,
    MQTT_BROKER,
    MQTT_CLIENT_ID,
    MQTT_PORT,
    MQTT_TELEMETRY_TOPIC,
)
from backend.detection.detector import (
    detect_telemetry,
    result_to_dict,
)


api = Blueprint(
    "api",
    __name__,
    url_prefix="/api",
)


# ============================================================================
# IN-MEMORY APPLICATION STATE
# ============================================================================

state_lock = threading.Lock()

latest_telemetry: dict[str, dict[str, Any]] = {}

alerts: deque[dict[str, Any]] = deque(maxlen=100)


# ============================================================================
# MQTT CALLBACKS
# ============================================================================

def on_connect(
    client: mqtt.Client,
    userdata: Any,
    flags: Any,
    reason_code: Any,
    properties: Any = None,
) -> None:
    """
    Subscribe to telemetry when the MQTT connection succeeds.
    """

    if reason_code == 0:
        print("[API/MQTT] Connected to MQTT broker.")

        client.subscribe(
            MQTT_TELEMETRY_TOPIC,
            qos=1,
        )

        print(
            f"[API/MQTT] Subscribed to "
            f"{MQTT_TELEMETRY_TOPIC}"
        )

    else:
        print(
            f"[API/MQTT] Connection failed: "
            f"{reason_code}"
        )


def on_message(
    client: mqtt.Client,
    userdata: Any,
    message: mqtt.MQTTMessage,
) -> None:
    """
    Process incoming telemetry.
    """

    try:
        telemetry = json.loads(
            message.payload.decode("utf-8")
        )

        if not isinstance(telemetry, dict):
            raise ValueError(
                "Telemetry payload must be a JSON object."
            )

        device_id = telemetry.get("device_id")

        if not device_id:
            raise ValueError(
                "Telemetry is missing device_id."
            )

        detection = detect_telemetry(telemetry)

        telemetry["detection"] = result_to_dict(
            detection
        )

        with state_lock:
            latest_telemetry[device_id] = telemetry

            if detection.status == "ANOMALY":
                alert = {
                    "alert_id": (
                        f"ALERT-{len(alerts) + 1:05d}"
                    ),
                    "device_id": device_id,
                    "device_type": telemetry.get(
                        "device_type"
                    ),
                    "location": telemetry.get(
                        "location"
                    ),
                    "timestamp": telemetry.get(
                        "timestamp"
                    ),
                    "severity": detection.severity,
                    "risk_score": detection.risk_score,
                    "reason": detection.reason,
                    "detection_type": (
                        detection.detection_type
                    ),
                    "source": "TELEMETRY",
                }

                alerts.appendleft(alert)

                print(
                    f"[ALERT] "
                    f"{detection.severity} | "
                    f"{device_id} | "
                    f"Risk={detection.risk_score} | "
                    f"{detection.reason}"
                )

    except Exception as error:
        print(
            f"[API/MQTT] Invalid telemetry: {error}"
        )


def create_mqtt_listener() -> mqtt.Client:
    """
    Create the MQTT client used by the Flask backend.
    """

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=MQTT_CLIENT_ID + "-api",
    )

    client.on_connect = on_connect
    client.on_message = on_message

    print(
        f"[API/MQTT] Connecting to "
        f"{MQTT_BROKER}:{MQTT_PORT}..."
    )

    client.connect(
        MQTT_BROKER,
        MQTT_PORT,
        keepalive=60,
    )

    client.loop_start()

    return client


# ============================================================================
# HEALTH
# ============================================================================

@api.get("/health")
def health() -> Any:
    """Return API health information."""

    with state_lock:
        connected_devices = len(latest_telemetry)

    return jsonify(
        {
            "status": "ok",
            "service": "PowerShield API",
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),
            "devices_reporting": connected_devices,
        }
    )


# ============================================================================
# DEVICES
# ============================================================================

@api.get("/devices")
def get_devices() -> Any:
    """
    Return all configured devices and their latest telemetry.
    """

    devices = []

    with state_lock:
        for device in DEVICES:
            device_id = device["device_id"]

            telemetry = latest_telemetry.get(
                device_id
            )

            item = {
                "device_id": device_id,
                "device_type": device["device_type"],
                "location": device["location"],
                "status": (
                    "ONLINE"
                    if telemetry
                    else "WAITING"
                ),
                "telemetry": telemetry,
            }

            devices.append(item)

    return jsonify(devices)


# ============================================================================
# TELEMETRY
# ============================================================================

@api.get("/telemetry")
def get_telemetry() -> Any:
    """
    Return the latest telemetry from every device.
    """

    with state_lock:
        data = list(
            latest_telemetry.values()
        )

    return jsonify(data)


# ============================================================================
# ALERTS
# ============================================================================

@api.get("/alerts")
def get_alerts() -> Any:
    """Return recent security alerts."""

    with state_lock:
        data = list(alerts)

    return jsonify(data)


# ============================================================================
# STATS
# ============================================================================

@api.get("/stats")
def get_stats() -> Any:
    """Return dashboard summary statistics."""

    with state_lock:
        telemetry = list(
            latest_telemetry.values()
        )

        alert_list = list(alerts)

    critical = sum(
        1
        for alert in alert_list
        if alert["severity"] == "CRITICAL"
    )

    high = sum(
        1
        for alert in alert_list
        if alert["severity"] == "HIGH"
    )

    risk_scores = [
        item["detection"]["risk_score"]
        for item in telemetry
        if "detection" in item
    ]

    average_risk = (
        round(sum(risk_scores) / len(risk_scores))
        if risk_scores
        else 0
    )

    return jsonify(
        {
            "total_devices": len(DEVICES),
            "online_devices": len(telemetry),
            "active_alerts": len(alert_list),
            "critical_alerts": critical,
            "high_alerts": high,
            "average_risk_score": average_risk,
        }
    )


# ============================================================================
# ATTACK SIMULATION
# ============================================================================

@api.post("/attacks/false-data-injection")
def simulate_false_data_injection() -> Any:
    """
    Simulate a false-data-injection attack.

    Example request:

        {
            "device_id": "RTU-01",
            "target_voltage_kv": 180
        }
    """

    data = request.get_json(
        silent=True
    ) or {}

    device_id = data.get(
        "device_id",
        "RTU-01",
    )

    target_voltage = float(
        data.get(
            "target_voltage_kv",
            180.0,
        )
    )

    with state_lock:
        original = latest_telemetry.get(
            device_id
        )

    if original is None:
        return jsonify(
            {
                "error": (
                    f"No telemetry available for "
                    f"{device_id}."
                )
            }
        ), 404

    attacked = create_false_data_injection(
        original,
        target_voltage,
    )

    detection = detect_telemetry(
        attacked
    )

    attacked["detection"] = result_to_dict(
        detection
    )

    attack_info = attacked.get(
        "attack",
        {},
    )

    alert = {
        "alert_id": (
            f"ATTACK-{datetime.now(timezone.utc).timestamp()}"
        ),
        "device_id": device_id,
        "device_type": attacked.get(
            "device_type"
        ),
        "location": attacked.get(
            "location"
        ),
        "timestamp": attacked.get(
            "timestamp"
        ),
        "severity": detection.severity,
        "risk_score": detection.risk_score,
        "reason": (
            "Simulated false-data injection: "
            f"{attack_info.get('original_voltage_kv')} kV "
            "→ "
            f"{attack_info.get('injected_voltage_kv')} kV"
        ),
        "detection_type": (
            "FALSE_DATA_INJECTION,"
            f"{detection.detection_type}"
        ),
        "source": "ATTACK_SIMULATOR",
    }

    with state_lock:
        latest_telemetry[device_id] = attacked
        alerts.appendleft(alert)

    return jsonify(
        {
            "message": (
                "False-data-injection attack "
                "simulated successfully."
            ),
            "telemetry": attacked,
            "alert": alert,
        }
    )


# ============================================================================
# MQTT ALERT PUBLISHER
# ============================================================================

def publish_alert(
    client: mqtt.Client,
    alert: dict[str, Any],
) -> None:
    """Publish an alert to MQTT."""

    payload = json.dumps(alert)

    client.publish(
        MQTT_ALERT_TOPIC,
        payload,
        qos=1,
    )