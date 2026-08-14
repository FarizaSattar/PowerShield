# python -m simulator.grid_simulator

"""
PowerShield Grid Simulator

This program simulates several devices that might exist in a simplified
electrical grid.

The devices generate realistic-ish electrical telemetry and publish it
using MQTT.

For now, we are simulating:

    RTU-01
    RTU-02
    PLC-01
    METER-01

Later, we will connect these devices to our detection engine, database,
attack simulator, Zeek, Suricata, and React dashboard.
"""

import json
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

from config.settings import (
    MQTT_BROKER,
    MQTT_PORT,
    MQTT_TELEMETRY_TOPIC,
    SIMULATION_INTERVAL,
    NORMAL_VOLTAGE_KV,
    NORMAL_FREQUENCY_HZ,
)


# ---------------------------------------------------------------------------
# SIMULATED DEVICES
# ---------------------------------------------------------------------------

DEVICES = [
    {
        "device_id": "RTU-01",
        "device_type": "RTU",
        "location": "Substation-A",
    },
    {
        "device_id": "RTU-02",
        "device_type": "RTU",
        "location": "Substation-B",
    },
    {
        "device_id": "PLC-01",
        "device_type": "PLC",
        "location": "Substation-A",
    },
    {
        "device_id": "METER-01",
        "device_type": "SMART_METER",
        "location": "Distribution-01",
    },
]


# ---------------------------------------------------------------------------
# TELEMETRY GENERATION
# ---------------------------------------------------------------------------

def generate_telemetry(device):
    """
    Generate a single telemetry measurement for a device.

    In a real power system, these values would come from actual sensors,
    meters, RTUs, PLCs, or SCADA systems.

    Here, we simulate them.
    """

    # Add a small random variation around the normal voltage.
    #
    # Example:
    #   Normal = 230 kV
    #
    # We might generate:
    #   229.8
    #   230.3
    #   230.1
    #
    # This is important because perfectly constant data would make our
    # anomaly detector unrealistically easy to build.
    voltage = random.gauss(
        NORMAL_VOLTAGE_KV,
        0.5
    )

    # Grid frequency normally stays very close to 60 Hz.
    frequency = random.gauss(
        NORMAL_FREQUENCY_HZ,
        0.02
    )

    # Simulate current.
    #
    # This is not intended to be a detailed electrical network simulation.
    # We're creating believable telemetry for our cybersecurity lab.
    current = random.gauss(
        420,
        10
    )

    # Random power factor between approximately 0.90 and 0.99.
    power_factor = random.uniform(
        0.90,
        0.99
    )

    # Simplified three-phase power calculation.
    #
    # P ≈ √3 × V × I × PF
    #
    # Since V is in kV and I is in A, divide by 1000 to get MW.
    power_mw = (
        1.732
        * voltage
        * current
        * power_factor
        / 1000
    )

    # Build the telemetry packet.
    telemetry = {
        "device_id": device["device_id"],
        "device_type": device["device_type"],
        "location": device["location"],

        # ISO timestamp makes the data easy to store and process later.
        "timestamp": datetime.now(timezone.utc).isoformat(),

        "voltage_kv": round(voltage, 3),
        "current_a": round(current, 3),
        "frequency_hz": round(frequency, 4),
        "power_factor": round(power_factor, 3),
        "power_mw": round(power_mw, 3),

        # Every device starts in a normal state.
        "status": "NORMAL",
    }

    return telemetry


# ---------------------------------------------------------------------------
# MQTT CONNECTION
# ---------------------------------------------------------------------------

def create_mqtt_client():
    """
    Create and connect an MQTT client.

    MQTT is the communication protocol our simulated devices use to
    publish telemetry.
    """

    # Create an MQTT client.
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id="powershield-grid-simulator"
    )

    print(
        f"[MQTT] Connecting to broker "
        f"{MQTT_BROKER}:{MQTT_PORT}..."
    )

    client.connect(
        MQTT_BROKER,
        MQTT_PORT,
        60
    )

    print("[MQTT] Connected successfully.")

    return client


# ---------------------------------------------------------------------------
# MAIN SIMULATION LOOP
# ---------------------------------------------------------------------------

def main():
    """
    Start the grid simulator.

    Every few seconds we generate telemetry for every simulated device
    and publish it to MQTT.
    """

    try:
        mqtt_client = create_mqtt_client()

    except Exception as error:
        print()
        print("ERROR: Could not connect to MQTT broker.")
        print(f"Details: {error}")
        print()
        print(
            "Make sure Mosquitto is running before starting "
            "the simulator."
        )
        return

    print()
    print("=" * 60)
    print("PowerShield Grid Simulator")
    print("=" * 60)

    print("Simulated devices:")

    for device in DEVICES:
        print(
            f"  - {device['device_id']} "
            f"({device['device_type']}) "
            f"@ {device['location']}"
        )

    print()
    print("Publishing telemetry...")
    print("Press CTRL+C to stop.")
    print()

    # Start the MQTT network loop.
    #
    # This allows the MQTT client to handle network communication
    # in the background.
    mqtt_client.loop_start()

    try:

        while True:

            # Generate one telemetry packet for every device.
            for device in DEVICES:

                telemetry = generate_telemetry(device)

                # Convert our Python dictionary into JSON.
                message = json.dumps(telemetry)

                # Publish the message to MQTT.
                mqtt_client.publish(
                    MQTT_TELEMETRY_TOPIC,
                    message
                )

                print(
                    f"[TELEMETRY] "
                    f"{device['device_id']} | "
                    f"V={telemetry['voltage_kv']} kV | "
                    f"I={telemetry['current_a']} A | "
                    f"F={telemetry['frequency_hz']} Hz | "
                    f"P={telemetry['power_mw']} MW"
                )

            # Wait before generating the next batch.
            time.sleep(SIMULATION_INTERVAL)

    except KeyboardInterrupt:

        print()
        print("Stopping PowerShield simulator...")

    finally:

        mqtt_client.loop_stop()
        mqtt_client.disconnect()

        print("MQTT connection closed.")
        print("Simulator stopped.")


# ---------------------------------------------------------------------------
# PROGRAM ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()