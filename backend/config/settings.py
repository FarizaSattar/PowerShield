"""
PowerShield configuration.

Centralized configuration for the MQTT broker, simulator,
grid operating parameters, API, and detection engine.
"""

import os

from dotenv import load_dotenv

load_dotenv()


# ============================================================================
# APPLICATION
# ============================================================================

APP_NAME = "PowerShield"

API_HOST = os.getenv("POWERSHIELD_API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("POWERSHIELD_API_PORT", "5000"))

DEBUG = os.getenv("POWERSHIELD_DEBUG", "true").lower() == "true"


# ============================================================================
# MQTT
# ============================================================================

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

MQTT_TELEMETRY_TOPIC = os.getenv(
    "MQTT_TELEMETRY_TOPIC",
    "powershield/grid/telemetry",
)

MQTT_ALERT_TOPIC = os.getenv(
    "MQTT_ALERT_TOPIC",
    "powershield/security/alerts",
)

MQTT_CLIENT_ID = os.getenv(
    "MQTT_CLIENT_ID",
    "powershield-grid-simulator",
)


# ============================================================================
# SIMULATOR
# ============================================================================

SIMULATION_INTERVAL = float(
    os.getenv("SIMULATION_INTERVAL", "2")
)


# ============================================================================
# GRID NORMAL VALUES
# ============================================================================

NORMAL_VOLTAGE_KV = float(
    os.getenv("NORMAL_VOLTAGE_KV", "230.0")
)

NORMAL_FREQUENCY_HZ = float(
    os.getenv("NORMAL_FREQUENCY_HZ", "60.0")
)

NORMAL_CURRENT_A = float(
    os.getenv("NORMAL_CURRENT_A", "420.0")
)

NORMAL_POWER_FACTOR = float(
    os.getenv("NORMAL_POWER_FACTOR", "0.95")
)


# ============================================================================
# DETECTION THRESHOLDS
# ============================================================================

VOLTAGE_MIN_KV = float(
    os.getenv("VOLTAGE_MIN_KV", "207.0")
)

VOLTAGE_MAX_KV = float(
    os.getenv("VOLTAGE_MAX_KV", "253.0")
)

FREQUENCY_MIN_HZ = float(
    os.getenv("FREQUENCY_MIN_HZ", "59.5")
)

FREQUENCY_MAX_HZ = float(
    os.getenv("FREQUENCY_MAX_HZ", "60.5")
)

CURRENT_MAX_A = float(
    os.getenv("CURRENT_MAX_A", "650.0")
)


# ============================================================================
# DEVICES
# ============================================================================

DEVICES = [
    {
        "device_id": "RTU-01",
        "device_type": "RTU",
        "location": "Substation-A",
        "voltage_nominal_kv": 230.0,
        "voltage_std_kv": 0.5,
        "current_nominal_a": 420.0,
        "current_std_a": 10.0,
    },
    {
        "device_id": "RTU-02",
        "device_type": "RTU",
        "location": "Substation-B",
        "voltage_nominal_kv": 230.0,
        "voltage_std_kv": 0.5,
        "current_nominal_a": 400.0,
        "current_std_a": 12.0,
    },
    {
        "device_id": "PLC-01",
        "device_type": "PLC",
        "location": "Substation-A",
        "voltage_nominal_kv": 230.0,
        "voltage_std_kv": 0.6,
        "current_nominal_a": 380.0,
        "current_std_a": 15.0,
    },
    {
        "device_id": "METER-01",
        "device_type": "SMART_METER",
        "location": "Distribution-01",
        "voltage_nominal_kv": 230.0,
        "voltage_std_kv": 0.4,
        "current_nominal_a": 250.0,
        "current_std_a": 8.0,
    },
]


DEVICE_LOOKUP = {
    device["device_id"]: device
    for device in DEVICES
}