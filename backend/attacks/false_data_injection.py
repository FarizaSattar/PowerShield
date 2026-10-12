"""
False Data Injection simulation.

This module modifies simulated telemetry to represent a cyber-physical
attack in the PowerShield test environment.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any


def create_false_data_injection(
    telemetry: dict[str, Any],
    target_voltage_kv: float = 180.0,
) -> dict[str, Any]:
    """
    Create a simulated false-data-injection event.

    The original telemetry dictionary is not modified.
    """

    modified = deepcopy(telemetry)

    original_voltage = float(modified.get("voltage_kv", 230.0))

    modified["voltage_kv"] = round(target_voltage_kv, 3)

    modified["attack"] = {
        "type": "FALSE_DATA_INJECTION",
        "original_voltage_kv": original_voltage,
        "injected_voltage_kv": target_voltage_kv,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    modified["status"] = "ATTACK_SIMULATED"

    return modified