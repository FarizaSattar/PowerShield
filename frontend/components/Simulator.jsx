import React, { useState, useEffect } from "react";
import { simulateFalseDataInjection } from "../api";

export default function Simulator({ devices, reloadData }) {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [attackVoltage, setAttackVoltage] = useState(180);
  const [attacking, setAttacking] = useState(false);
  const [attackMessage, setAttackMessage] = useState("");

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0].device_id || devices[0].id);
    }
  }, [devices, selectedDevice]);

  async function handleAttack() {
    if (!selectedDevice || attacking) return;
    setAttacking(true);
    setAttackMessage("");

    try {
      const result = await simulateFalseDataInjection(selectedDevice, attackVoltage);
      setAttackMessage(
        result?.message || `False-data injection successfully executed against ${selectedDevice}.`
      );
      await reloadData();
    } catch (err) {
      console.error(err);
      setAttackMessage("Attack simulation failed. Verify backend gateway connection.");
    } finally {
      setAttacking(false);
    }
  }

  return (
    <div className="simulator-grid">
      <section className="simulator-card">
        <span className="page-kicker">CYBER-PHYSICAL TESTING</span>
        <h2>False-Data Injection (FDI) Sandbox</h2>
        <p>
          Inject fraudulent telemetry values directly into substation controllers to simulate sophisticated cyber attacks against power grid infrastructure.
        </p>

        <div className="form">
          <label>
            TARGET SUBSTATION DEVICE
            <select
              value={selectedDevice}
              onChange={(event) => setSelectedDevice(event.target.value)}
            >
              {devices.map((device, idx) => {
                const id = device.device_id || device.id;
                return (
                  <option key={id || idx} value={id}>
                    {id} — {device.location || "Substation"} ({device.device_type || "Asset"})
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            INJECTED VOLTAGE MAGNITUDE
            <div className="voltage-input">
              <input
                type="number"
                value={attackVoltage}
                onChange={(event) => setAttackVoltage(Number(event.target.value))}
              />
              <span>kV</span>
            </div>
            <small className="input-hint">Normal operating range: 110 kV – 230 kV</small>
          </label>

          <button
            className="simulate-btn"
            type="button"
            disabled={attacking || !selectedDevice}
            onClick={handleAttack}
          >
            {attacking ? "Injecting Payload..." : "Execute Attack Simulation ϟ"}
          </button>
        </div>

        {attackMessage && (
          <div className="simulation-result animate-fade">
            <span>⚡</span>
            <div>
              <strong>Simulation Report</strong>
              <p>{attackMessage}</p>
            </div>
          </div>
        )}
      </section>

      <section className="pipeline-card">
        <span className="page-kicker">DETECTION ARCHITECTURE</span>
        <h2>PowerShield Defense Pipeline</h2>
        <p>
          How incoming telemetry is analyzed in real-time to mitigate cyber threats before physical equipment damage occurs.
        </p>

        <div className="pipeline-steps">
          <PipelineStep
            number="01"
            title="Raw Telemetry Ingestion"
            text="Sensors stream voltage, current, and frequency metrics from remote substations."
          />
          <PipelineStep
            number="02"
            title="Feature Transformation"
            text="Telemetry vectors are normalized and mapped into sliding temporal windows."
          />
          <PipelineStep
            number="03"
            title="AI & Heuristic Analysis"
            text="Ensemble detection models evaluate residual errors and state estimation anomalies."
          />
          <PipelineStep
            number="04"
            title="Risk Scoring & Alerting"
            text="Automated SOC alerts are triggered and risk indexes are updated instantly."
          />
        </div>
      </section>
    </div>
  );
}

function PipelineStep({ number, title, text }) {
  return (
    <div className="pipeline-step">
      <span className="step-num">{number}</span>
      <div className="step-content">
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}