import React, { useState, useMemo } from "react";

export default function AlertList({ alerts, limit }) {
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const sev = (a.severity || "").toLowerCase();
      if (severityFilter === "all") return true;
      return sev.includes(severityFilter);
    });
  }, [alerts, severityFilter]);

  const displayedAlerts = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div className="alert-component-wrapper">
      {!limit && (
        <div className="controls-bar">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${severityFilter === "all" ? "active" : ""}`}
              onClick={() => setSeverityFilter("all")}
            >
              All Severities
            </button>
            <button
              type="button"
              className={`filter-btn ${severityFilter === "critical" ? "active" : ""}`}
              onClick={() => setSeverityFilter("critical")}
            >
              Critical
            </button>
            <button
              type="button"
              className={`filter-btn ${severityFilter === "high" ? "active" : ""}`}
              onClick={() => setSeverityFilter("high")}
            >
              High
            </button>
            <button
              type="button"
              className={`filter-btn ${severityFilter === "medium" ? "active" : ""}`}
              onClick={() => setSeverityFilter("medium")}
            >
              Medium / Low
            </button>
          </div>
        </div>
      )}

      <div className="alert-list">
        {displayedAlerts.length === 0 ? (
          <div className="empty-state">
            <span>◎</span>
            <p>No security events match the current filter.</p>
          </div>
        ) : (
          displayedAlerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}

function AlertItem({ alert }) {
  const severity = alert.severity?.toLowerCase() || "medium";

  return (
    <div className="alert-item">
      <div className={`alert-indicator ${severity}`} />
      <div className="alert-body">
        <div className="alert-meta">
          <span className={`severity-tag ${severity}`}>
            {alert.severity || "Warning"}
          </span>
          <span className="alert-device-tag">
            {alert.device_id || alert.src_ip || "Grid Node"}
          </span>
        </div>
        <strong>{alert.reason || alert.event_type || "Abnormal telemetry pattern detected."}</strong>
        <small>Source: {alert.source || "PowerShield Anomaly Engine"}</small>
      </div>
    </div>
  );
}