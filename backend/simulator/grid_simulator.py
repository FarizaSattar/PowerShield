"""
PowerShield Grid Simulator.

Generates realistic-ish telemetry for simulated RTUs, PLCs,
and smart meters and publishes the telemetry through MQTT.

Run from the project root:

    python -m backend.simulator.grid_simulator
"""

from __future__ import annotations

import json
import random
import time
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt

from backend.config.settings import (
    DEVICES,
    MQTT_BROKER,
    MQTT_CLIENT_ID,
    MQTT_PORT,
    MQTT_TELEMETRY_TOPIC,
    SIMULATION_INTERVAL,
)


def generate_telemetry(device: dict[str, Any]) -> dict[str, Any]:
    """
    Generate one telemetry measurement for a simulated device.
    """

    voltage = random.gauss(
        device["voltage_nominal_kv"],
        device["voltage_std_kv"],
    )

    current = random.gauss(
        device["current_nominal_a"],
        device["current_std_a"],
    )

    frequency = random.gauss(
        60.0,
        0.02,
    )

    power_factor = random.uniform(
        0.90,
        0.99,
    )

    power_mw = (
        1.732
        * voltage
        * current
        * power_factor
        / 1000
    )

    return {
        "device_id": device["device_id"],
        "device_type": device["device_type"],
        "location": device["location"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "voltage_kv": round(voltage, 3),
        "current_a": round(current, 3),
        "frequency_hz": round(frequency, 4),
        "power_factor": round(power_factor, 3),
        "power_mw": round(power_mw, 3),
        "status": "NORMAL",
    }


def create_mqtt_client() -> mqtt.Client:
    """
    Create an MQTT client using Paho MQTT 2.x callback API.
    """

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=MQTT_CLIENT_ID,
    )

    print(
        f"[MQTT] Connecting to "
        f"{MQTT_BROKER}:{MQTT_PORT}..."
    )

    client.connect(
        MQTT_BROKER,
        MQTT_PORT,
        keepalive=60,
    )

    print("[MQTT] Connected successfully.")

    return client


def publish_telemetry(
    client: mqtt.Client,
    telemetry: dict[str, Any],
) -> None:
    """
    Publish telemetry to the configured MQTT topic.
    """

    payload = json.dumps(
        telemetry,
        separators=(",", ":"),
    )

    result = client.publish(
        MQTT_TELEMETRY_TOPIC,
        payload,
        qos=1,
    )

    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        print(
            f"[MQTT] Failed to publish "
            f"{telemetry['device_id']}: "
            f"{mqtt.error_string(result.rc)}"
        )


def main() -> None:
    """Run the PowerShield grid simulator."""

    try:
        client = create_mqtt_client()

    except Exception as error:
        print()
        print("[ERROR] Could not connect to MQTT broker.")
        print(f"Details: {error}")
        print()
        print(
            "Make sure Mosquitto is installed and running "
            "on the configured MQTT port."
        )
        return

    print()
    print("=" * 70)
    print("PowerShield Grid Simulator")
    print("=" * 70)

    print("Simulated devices:")

    for device in DEVICES:
        print(
            f"  • {device['device_id']} "
            f"({device['device_type']}) "
            f"@ {device['location']}"
        )

    print()
    print(f"MQTT topic: {MQTT_TELEMETRY_TOPIC}")
    print(f"Interval: {SIMULATION_INTERVAL}s")
    print("Press CTRL+C to stop.")
    print()

    client.loop_start()

    try:
        while True:
            for device in DEVICES:
                telemetry = generate_telemetry(device)

                publish_telemetry(
                    client,
                    telemetry,
                )

                print(
                    f"[TELEMETRY] "
                    f"{telemetry['device_id']} | "
                    f"V={telemetry['voltage_kv']:.3f} kV | "
                    f"I={telemetry['current_a']:.1f} A | "
                    f"F={telemetry['frequency_hz']:.4f} Hz | "
                    f"P={telemetry['power_mw']:.3f} MW"
                )

            time.sleep(SIMULATION_INTERVAL)

    except KeyboardInterrupt:
        print()
        print("Stopping simulator...")

    finally:
        client.loop_stop()
        client.disconnect()

        print("MQTT connection closed.")
        print("Simulator stopped.")


if __name__ == "__main__":
    main()