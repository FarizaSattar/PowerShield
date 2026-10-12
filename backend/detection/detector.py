"""
PowerShield detection engine.

Phase 1 uses deterministic rules to identify obviously abnormal
grid telemetry.

Later phases will add:
    - Isolation Forest
    - statistical baselines
    - time-series anomaly detection
    - network telemetry
    - Zeek
    - Suricata
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from backend.config.settings import (
    CURRENT_MAX_A,
    FREQUENCY_MAX_HZ,
    FREQUENCY_MIN_HZ,
    NORMAL_VOLTAGE_KV,
    VOLTAGE_MAX_KV,
    VOLTAGE_MIN_KV,
)


@dataclass
class DetectionResult:
    """
    Result returned by the detection engine.
    """

    status: str
    severity: str
    risk_score: int
    reason: str
    detection_type: str


def clamp_score(score: int) -> int:
    """Keep risk scores inside the 0–100 range."""

    return max(0, min(100, score))


def detect_telemetry(telemetry: dict[str, Any]) -> DetectionResult:
    """
    Analyze one telemetry message.

    The first version uses deterministic rules.

    Returns:
        DetectionResult containing status, severity,
        risk score, reason, and detection type.
    """

    voltage = float(telemetry.get("voltage_kv", NORMAL_VOLTAGE_KV))
    frequency = float(telemetry.get("frequency_hz", 60.0))
    current = float(telemetry.get("current_a", 0.0))

    findings: list[str] = []
    scores: list[int] = []
    detection_types: list[str] = []

    # ------------------------------------------------------------------
    # Voltage detection
    # ------------------------------------------------------------------

    if voltage < VOLTAGE_MIN_KV:
        deviation = (
            (NORMAL_VOLTAGE_KV - voltage)
            / NORMAL_VOLTAGE_KV
            * 100
        )

        findings.append(
            f"Voltage below operating range "
            f"({voltage:.2f} kV, {deviation:.1f}% below nominal)"
        )

        scores.append(min(95, int(50 + deviation * 2)))
        detection_types.append("VOLTAGE_ANOMALY")

    elif voltage > VOLTAGE_MAX_KV:
        deviation = (
            (voltage - NORMAL_VOLTAGE_KV)
            / NORMAL_VOLTAGE_KV
            * 100
        )

        findings.append(
            f"Voltage above operating range "
            f"({voltage:.2f} kV, {deviation:.1f}% above nominal)"
        )

        scores.append(min(95, int(50 + deviation * 2)))
        detection_types.append("VOLTAGE_ANOMALY")

    # ------------------------------------------------------------------
    # Frequency detection
    # ------------------------------------------------------------------

    if frequency < FREQUENCY_MIN_HZ:
        deviation = abs(frequency - 60.0)

        findings.append(
            f"Frequency below operating range "
            f"({frequency:.3f} Hz)"
        )

        scores.append(min(90, int(50 + deviation * 30)))
        detection_types.append("FREQUENCY_ANOMALY")

    elif frequency > FREQUENCY_MAX_HZ:
        deviation = abs(frequency - 60.0)

        findings.append(
            f"Frequency above operating range "
            f"({frequency:.3f} Hz)"
        )

        scores.append(min(90, int(50 + deviation * 30)))
        detection_types.append("FREQUENCY_ANOMALY")

    # ------------------------------------------------------------------
    # Current detection
    # ------------------------------------------------------------------

    if current > CURRENT_MAX_A:
        findings.append(
            f"Current exceeds threshold "
            f"({current:.1f} A)"
        )

        scores.append(75)
        detection_types.append("CURRENT_ANOMALY")

    # ------------------------------------------------------------------
    # Normal result
    # ------------------------------------------------------------------

    if not findings:
        return DetectionResult(
            status="NORMAL",
            severity="INFO",
            risk_score=0,
            reason="Telemetry within expected operating range",
            detection_type="NONE",
        )

    # ------------------------------------------------------------------
    # Determine overall severity
    # ------------------------------------------------------------------

    risk_score = clamp_score(max(scores))

    if risk_score >= 80:
        severity = "CRITICAL"
    elif risk_score >= 60:
        severity = "HIGH"
    elif risk_score >= 35:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    # Multiple anomalies increase confidence.
    if len(findings) >= 2:
        risk_score = clamp_score(risk_score + 10)

        if risk_score >= 80:
            severity = "CRITICAL"
        elif risk_score >= 60:
            severity = "HIGH"

    return DetectionResult(
        status="ANOMALY",
        severity=severity,
        risk_score=risk_score,
        reason="; ".join(findings),
        detection_type=",".join(sorted(set(detection_types))),
    )


def result_to_dict(result: DetectionResult) -> dict[str, Any]:
    """Convert a DetectionResult to a JSON-compatible dictionary."""

    return {
        "status": result.status,
        "severity": result.severity,
        "risk_score": result.risk_score,
        "reason": result.reason,
        "detection_type": result.detection_type,
    }