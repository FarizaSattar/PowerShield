"""
PowerShield configuration.

This file contains settings that are shared across the application.

Keeping configuration in one place makes it much easier to change things
later without having to search through every Python file.
"""

# ---------------------------------------------------------------------------
# MQTT SETTINGS
# ---------------------------------------------------------------------------

# MQTT broker hostname.
#
# For our first local version, Mosquitto will run on our own computer.
MQTT_BROKER = "localhost"

# Standard MQTT port.
MQTT_PORT = 1883

# Topic where our simulated grid devices publish telemetry.
MQTT_TELEMETRY_TOPIC = "powershield/grid/telemetry"


# ---------------------------------------------------------------------------
# SIMULATOR SETTINGS
# ---------------------------------------------------------------------------

# How often each simulated device sends telemetry.
#
# 2 seconds means:
#   RTU-01 -> message
#   wait 2 seconds
#   RTU-01 -> message
#   ...
SIMULATION_INTERVAL = 2


# ---------------------------------------------------------------------------
# GRID SETTINGS
# ---------------------------------------------------------------------------

# Normal transformer voltage.
NORMAL_VOLTAGE_KV = 230.0

# Normal grid frequency.
NORMAL_FREQUENCY_HZ = 60.0

# Number of simulated devices.
NUMBER_OF_DEVICES = 4