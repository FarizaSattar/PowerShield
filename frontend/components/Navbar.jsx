import React from "react";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "⌂", description: "SOC Command Center" },
  { id: "devices", label: "Grid Assets", icon: "◈", description: "OT Telemetry & Status" },
  { id: "alerts", label: "Threat Events", icon: "⚠", description: "Anomaly & Attack Log" },
  { id: "simulator", label: "Cyber Lab", icon: "ϟ", description: "FDI Attack Sandbox" },
];

export default function Navbar({ activePage, setActivePage, stats, connectionStatus, error, loading }) {
  const activeAlertCount = stats.active_alerts || stats.open_alerts || 0;

  return (
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
            <small>OT / ICS Defense Grid</small>
          </span>
        </button>

        <nav className="powershield-navigation" aria-label="Main Navigation">
          {navigation.map((item) => (
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
                <span className="nav-count animate-pulse" aria-label={`${activeAlertCount} active alerts`}>
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

          <div
            className={`navbar-connection ${
              error ? "connection-offline" : loading ? "connection-loading" : "connection-secure"
            }`}
          >
            <span className="connection-light" />
            <div>
              <small>GRID STATUS</small>
              <strong>{connectionStatus}</strong>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}