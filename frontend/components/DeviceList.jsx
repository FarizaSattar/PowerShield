import React, { useState, useMemo } from "react";

export default function DeviceList({ devices, limit }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const id = d.device_id || d.id || "";
      const loc = d.location || "";
      const type = d.device_type || "";
      const matchesSearch =
        id.toLowerCase().includes(search.toLowerCase()) ||
        loc.toLowerCase().includes(search.toLowerCase()) ||
        type.toLowerCase().includes(search.toLowerCase());

      const isOffline = (d.status || "").toLowerCase().includes("offline");
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "online" && !isOffline) ||
        (filterStatus === "offline" && isOffline);

      return matchesSearch && matchesStatus;
    });
  }, [devices, search, filterStatus]);

  const displayedDevices = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div className="device-component-wrapper">
      {!limit && (
        <div className="controls-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by ID, location, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All Assets
            </button>
            <button
              type="button"
              className={`filter-btn ${filterStatus === "online" ? "active" : ""}`}
              onClick={() => setFilterStatus("online")}
            >
              Online Only
            </button>
            <button
              type="button"
              className={`filter-btn ${filterStatus === "offline" ? "active" : ""}`}
              onClick={() => setFilterStatus("offline")}
            >
              Offline Only
            </button>
          </div>
        </div>
      )}

      <div className="device-list">
        {displayedDevices.length === 0 ? (
          <div className="empty-state">
            <span>◎</span>
            <p>No matching grid assets found.</p>
          </div>
        ) : (
          displayedDevices.map((device, idx) => (
            <DeviceItem key={device.device_id || device.id || idx} device={device} />
          ))
        )}
      </div>
    </div>
  );
}

function DeviceItem({ device }) {
  const risk = Number(device.risk_score ?? device.detection?.risk_score ?? 0);
  const voltage = device.telemetry?.voltage_kv ?? device.voltage_kv;
  const power = device.telemetry?.power_mw ?? device.power_mw;
  const isOffline = (device.status || "").toLowerCase().includes("offline");
  const deviceId = device.device_id || device.id || "Unknown Device";

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
      <div
        className={`risk-badge ${
          risk >= 80 ? "critical" : risk >= 60 ? "high" : risk >= 35 ? "medium" : "low"
        }`}
      >
        <small>Risk</small>
        <strong>{Number.isFinite(risk) ? risk.toFixed(0) : "0"}</strong>
      </div>
    </div>
  );
}