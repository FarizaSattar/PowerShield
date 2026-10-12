import React, { useEffect, useState, useMemo } from "react";
import {
  getAlerts,
  getDevices,
  getStats,
  simulateFalseDataInjection,
} from "./api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const NAVIGATION_TABS = [
  { id: "dashboard", label: "Overview", icon: "⌂", description: "SOC Command Center" },
  { id: "devices", label: "Grid Assets", icon: "◈", description: "OT Telemetry & Status" },
  { id: "alerts", label: "Threat Events", icon: "⚠", description: "Anomaly & Attack Log" },
  { id: "simulator", label: "Cyber Lab", icon: "ϟ", description: "FDI Attack Sandbox" },
];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total_devices: 0,
    online_devices: 0,
    active_alerts: 0,
    critical_alerts: 0,
    high_alerts: 0,
    average_risk_score: 0,
    risk_score: 0,
    open_alerts: 0,
    ot_devices: 0,
    high_severity: 0
  });

  const [selectedDevice, setSelectedDevice] = useState("");
  const [attackVoltage, setAttackVoltage] = useState(180);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [error, setError] = useState(null);
  const [attackMessage, setAttackMessage] = useState("");

  // Search & Filter states
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilterStatus, setDeviceFilterStatus] = useState("all");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("all");

  async function loadData() {
    try {
      const [deviceData, alertData, statsData] = await Promise.all([
        getDevices().catch(() => []),
        getAlerts().catch(() => []),
        getStats().catch(() => null),
      ]);

      setDevices(Array.isArray(deviceData) ? deviceData : []);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      
      if (statsData) {
        setStats({
          total_devices: statsData.total_devices || statsData.ot_devices || 0,
          online_devices: statsData.online_devices || 0,
          active_alerts: statsData.active_alerts || statsData.open_alerts || 0,
          critical_alerts: statsData.critical_alerts || 0,
          high_alerts: statsData.high_alerts || statsData.high_severity || 0,
          average_risk_score: statsData.average_risk_score || statsData.risk_score || 0,
          risk_score: statsData.risk_score || statsData.average_risk_score || 0,
          open_alerts: statsData.open_alerts || statsData.active_alerts || 0,
          ot_devices: statsData.ot_devices || statsData.total_devices || 0,
          high_severity: statsData.high_severity || statsData.high_alerts || 0
        });
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the PowerShield SCADA telemetry daemon.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = window.setInterval(loadData, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!devices.length) {
      setSelectedDevice("");
      return;
    }
    if (!devices.some((d) => (d.device_id || d.id) === selectedDevice)) {
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
        result?.message ||
          `False-data injection successfully executed against ${selectedDevice}.`
      );
      await loadData();
    } catch (err) {
      console.error(err);
      setAttackMessage("Attack simulation failed. Verify backend gateway connection.");
    } finally {
      setAttacking(false);
    }
  }

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const id = d.device_id || d.id || "";
      const loc = d.location || "";
      const type = d.device_type || "";
      const matchesSearch =
        id.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        loc.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        type.toLowerCase().includes(deviceSearch.toLowerCase());
      
      const isOffline = (d.status || "").toLowerCase().includes("offline");
      const matchesStatus =
        deviceFilterStatus === "all" ||
        (deviceFilterStatus === "online" && !isOffline) ||
        (deviceFilterStatus === "offline" && isOffline);

      return matchesSearch && matchesStatus;
    });
  }, [devices, deviceSearch, deviceFilterStatus]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const sev = (a.severity || "").toLowerCase();
      if (alertSeverityFilter === "all") return true;
      return sev.includes(alertSeverityFilter);
    });
  }, [alerts, alertSeverityFilter]);

  const trafficData = useMemo(() => {
    const counts = alerts.reduce((acc, e) => {
      const timeLabel = new Date(e.timestamp || Date.now()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      acc[timeLabel] ??= { time: timeLabel, packets: 0 };
      acc[timeLabel].packets++;
      return acc;
    }, {});
    return Object.values(counts);
  }, [alerts]);

  const protocolData = useMemo(() => {
    const counts = alerts.reduce((acc, e) => {
      const proto = e.protocol || e.event_type || 'Modbus/TCP';
      acc[proto] = (acc[proto] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [alerts]);

  const connectionStatus = error ? "OFFLINE" : loading ? "CONNECTING" : "SECURE";
  const activeAlertCount = stats.active_alerts || stats.open_alerts || alerts.length;
  const criticalCount = stats.critical_alerts || stats.high_severity || 0;

  return (
    <div className="powershield-app">
      {/* SCADA TOP NAVIGATION BAR */}
      <header className="powershield-navbar">
        <div className="navbar-content">
          <button
            className="powershield-logo"
            type="button"
            onClick={() => setActivePage("dashboard")}
          >
            <span className="logo-symbol">⚡</span>
            <span className="logo-text">
              <strong>PowerShield</strong>
              <small>SCADA / ICS Grid Defense</small>
            </span>
          </button>

          <nav className="powershield-navigation">
            {NAVIGATION_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`powershield-nav-button ${activePage === item.id ? "selected" : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                <span className="nav-button-icon">{item.icon}</span>
                <div className="nav-button-text">
                  <span className="nav-label-text">{item.label}</span>
                  <small className="nav-desc-text">{item.description}</small>
                </div>
                {item.id === "alerts" && activeAlertCount > 0 && (
                  <span className="nav-count animate-pulse">
                    {activeAlertCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="navbar-right">
            <button
              type="button"
              className="action-trigger-btn"
              onClick={() => setActivePage("simulator")}
            >
              <span>⚡ Quick Lab</span>
            </button>

            <div className={`navbar-connection connection-${error ? "offline" : loading ? "loading" : "secure"}`}>
              <span className="connection-light" />
              <div>
                <small>GRID STATUS</small>
                <strong>{connectionStatus}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN APPLICATION CONTENT AREA */}
      <main className="powershield-content">
        <section className="page-heading">
          <div className="heading-left">
            <span className="page-kicker">
              {activePage === "dashboard" && "SCADA CONTROL OPERATIONS CENTER"}
              {activePage === "devices" && "SUBSTATION ASSET INVENTORY"}
              {activePage === "alerts" && "REAL-TIME THREAT LOG"}
              {activePage === "simulator" && "CYBER-PHYSICAL ATTACK SANDBOX"}
            </span>
            <h1>
              {activePage === "dashboard" && "Grid Command Overview"}
              {activePage === "devices" && "Grid Infrastructure"}
              {activePage === "alerts" && "Security Event Stream"}
              {activePage === "simulator" && "Simulation Laboratory"}
            </h1>
            <p>
              {activePage === "dashboard" && "Real-time AI-driven monitoring and intrusion detection for smart grid electrical substations."}
              {activePage === "devices" && "Inspect live telemetry, grid voltage stability, active loads, and risk posture across all substations."}
              {activePage === "alerts" && "Examine threat triggers, anomaly flags, and severity classifications generated by the detection pipeline."}
              {activePage === "simulator" && "Inject false sensor readings to test substation immunity and observe real-time defense responses."}
            </p>
          </div>

          <div className="heading-right">
            <div className="timestamp-badge">
              <span>UTC: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="system-error">
            <strong>SCADA Gateway Warning:</strong>
            <span>{error}</span>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activePage === "dashboard" && (
          <>
            <div className="stats">
              <Stat
                icon="◈"
                label="MONITORED ASSETS"
                value={stats.total_devices || stats.ot_devices || devices.length}
                detail={`${stats.online_devices} online & active`}
                trend="Stable"
              />
              <Stat
                icon="⚠"
                label="ACTIVE ALERTS"
                value={activeAlertCount}
                detail="Requires SOC review"
                trend={activeAlertCount > 0 ? "Elevated" : "Normal"}
                alertState={activeAlertCount > 0}
              />
              <Stat
                icon="⚡"
                label="CRITICAL SEVERITY"
                value={criticalCount}
                detail={`${stats.high_alerts} high priority warnings`}
                trend={criticalCount > 0 ? "Critical" : "Secure"}
                alertState={criticalCount > 0}
              />
              <Stat
                icon="◉"
                label="GRID RISK INDEX"
                value={`${Number(stats.average_risk_score || stats.risk_score || 0).toFixed(0)}%`}
                detail="Average threat score"
                trend={(stats.average_risk_score || stats.risk_score) > 50 ? "High Risk" : "Optimal"}
              />
            </div>

            <div className="dashboard-columns">
              <Panel
                title="Live Device Telemetry"
                subtitle="Recent operational measurements"
                action={
                  <button className="panel-link-btn" onClick={() => setActivePage("devices")}>
                    View All ({devices.length}) →
                  </button>
                }
              >
                <div className="device-list">
                  {devices.length === 0 ? (
                    <Empty message="No devices reporting telemetry." />
                  ) : (
                    devices.slice(0, 5).map((device, idx) => (
                      <DeviceComponent key={device.device_id || device.id || idx} device={device} />
                    ))
                  )}
                </div>
              </Panel>

              <Panel
                title="Recent Security Alerts"
                subtitle="Latest detection engine events"
                action={
                  <button className="panel-link-btn" onClick={() => setActivePage("alerts")}>
                    View All ({alerts.length}) →
                  </button>
                }
              >
                <div className="alert-list">
                  {alerts.length === 0 ? (
                    <Empty message="No active security events recorded." />
                  ) : (
                    alerts.slice(0, 5).map((alert, index) => (
                      <AlertItemComponent key={index} alert={alert} />
                    ))
                  )}
                </div>
              </Panel>
            </div>

            <div className="chart-grid">
              <section className="chart-card">
                <div className="card-title">
                  <div>
                    <h2>Event Rate Activity</h2>
                    <p>Incoming packets and anomalies per minute</p>
                  </div>
                  <span className="badge info">Live Stream</span>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trafficData.length ? trafficData : [{ time: 'Now', packets: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                      <Line type="monotone" dataKey="packets" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="chart-card">
                <div className="card-title">
                  <div>
                    <h2>Protocol Distribution</h2>
                    <p>Breakdown of industrial protocols</p>
                  </div>
                  <span className="badge info">Telemetry</span>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={protocolData.length ? protocolData : [{ name: 'Modbus/MQTT', count: 1 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                      <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <section className="attack-banner-card">
              <div className="banner-content">
                <span className="page-kicker">INTERACTIVE SANDBOX</span>
                <h2>Test Cyber-Physical Resilience</h2>
                <p>
                  Launch simulated false-data injection attacks on voltage regulators or transformers to evaluate PowerShield's anomaly detection pipeline in real-time.
                </p>
              </div>
              <button
                type="button"
                className="banner-action-btn"
                onClick={() => setActivePage("simulator")}
              >
                Open Attack Simulator ϟ
              </button>
            </section>
          </>
        )}

        {/* DEVICES VIEW */}
        {activePage === "devices" && (
          <Panel
            title="Grid Infrastructure Telemetry"
            subtitle={`Showing ${filteredDevices.length} of ${devices.length} monitored assets`}
          >
            <div className="controls-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by ID, location, or type..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                />
              </div>

              <div className="filter-group">
                {["all", "online", "offline"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`filter-btn ${deviceFilterStatus === status ? "active" : ""}`}
                    onClick={() => setDeviceFilterStatus(status)}
                  >
                    {status === "all" ? "All Assets" : `${status.charAt(0).toUpperCase() + status.slice(1)} Only`}
                  </button>
                ))}
              </div>
            </div>

            <div className="device-list">
              {filteredDevices.length === 0 ? (
                <Empty message="No matching grid assets found." />
              ) : (
                filteredDevices.map((device, idx) => (
                  <DeviceComponent key={device.device_id || device.id || idx} device={device} />
                ))
              )}
            </div>
          </Panel>
        )}

        {/* ALERTS VIEW */}
        {activePage === "alerts" && (
          <Panel
            title="Security Event Stream"
            subtitle={`${filteredAlerts.length} threat records captured`}
          >
            <div className="controls-bar">
              <div className="filter-group">
                {["all", "critical", "high", "medium"].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    className={`filter-btn ${alertSeverityFilter === sev ? "active" : ""}`}
                    onClick={() => setAlertSeverityFilter(sev)}
                  >
                    {sev === "all" ? "All Severities" : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="alert-list">
              {filteredAlerts.length === 0 ? (
                <Empty message="No security events match the current filter." />
              ) : (
                filteredAlerts.map((alert, index) => (
                  <AlertItemComponent key={index} alert={alert} />
                ))
              )}
            </div>
          </Panel>
        )}

        {/* SIMULATOR VIEW */}
        {activePage === "simulator" && (
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
                <PipelineStep number="01" title="Raw Telemetry Ingestion" text="Sensors stream voltage, current, and frequency metrics from remote substations." />
                <PipelineStep number="02" title="Feature Transformation" text="Telemetry vectors are normalized and mapped into sliding temporal windows." />
                <PipelineStep number="03" title="AI & Heuristic Analysis" text="Ensemble detection models evaluate residual errors and state estimation anomalies." />
                <PipelineStep number="04" title="Risk Scoring & Alerting" text="Automated SOC alerts are triggered and risk indexes are updated instantly." />
              </div>
            </section>
          </div>
        )}

        <footer className="footer">
          <div>
            <strong>PowerShield</strong> OT / ICS Cybersecurity Defense Laboratory
          </div>
          <span>SIMULATED SMART GRID ENVIRONMENT</span>
        </footer>
      </main>
    </div>
  );
}

// =========================================================
// SCADA UI SUB-COMPONENTS
// =========================================================

function Stat({ icon, label, value, detail, trend, alertState }) {
  return (
    <div className={`stat ${alertState ? "stat-alert" : ""}`}>
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action && <div>{action}</div>}
      </header>
      {children}
    </section>
  );
}

function DeviceComponent({ device }) {
  const risk = Number(device.risk_score ?? device.detection?.risk_score ?? 0);
  const voltage = device.telemetry?.voltage_kv ?? device.voltage_kv;
  const power = device.telemetry?.power_mw ?? device.power_mw;
  const isOffline = (device.status || "").toLowerCase().includes("offline");
  const deviceId = device.device_id || device.id || "Unknown Device";

  const getRiskClass = (r) => {
    if (r >= 80) return "critical";
    if (r >= 60) return "high";
    if (r >= 35) return "medium";
    return "low";
  };

  return (
    <div className="device">
      <div className="device-info">
        <strong>{deviceId}</strong>
        <small>{device.location || "Grid Substation"}</small>
      </div>

      <div className="device-kind">
        <span className="badge-type">{device.device_type || "Substation Device"}</span>
      </div>

      <div className="device-metric">
        <small>VOLTAGE</small>
        <strong>{voltage != null ? `${Number(voltage).toFixed(1)} kV` : "—"}</strong>
      </div>

      <div className="device-metric">
        <small>POWER</small>
        <strong>{power != null ? `${Number(power).toFixed(1)} MW` : "—"}</strong>
      </div>

      <div className={`device-status ${isOffline ? "offline" : "online"}`}>
        <span className="status-dot" />
        {device.status || "Online"}
      </div>

      <div className={`risk-badge ${getRiskClass(risk)}`}>
        <small>Risk</small>
        <strong>{Number.isFinite(risk) ? risk.toFixed(0) : "0"}</strong>
      </div>
    </div>
  );
}

function AlertItemComponent({ alert }) {
  const severity = alert.severity?.toLowerCase() || "medium";

  return (
    <div className="alert-item">
      <div className={`alert-indicator ${severity}`} />
      <div className="alert-body">
        <div className="alert-meta">
          <span className={`severity-tag ${severity}`}>
            {alert.severity || "Warning"}
          </span>
          <span className="alert-device-tag">{alert.device_id || alert.src_ip || "Grid Node"}</span>
        </div>
        <strong>{alert.reason || alert.event_type || "Abnormal telemetry pattern detected."}</strong>
        <small>Source: {alert.source || "PowerShield Anomaly Engine"}</small>
      </div>
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

function Empty({ message = "No data available." }) {
  return (
    <div className="empty-state">
      <span>◎</span>
      <p>{message}</p>
    </div>
  );
}