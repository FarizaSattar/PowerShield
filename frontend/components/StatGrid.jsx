import React from "react";

export default function StatGrid({ stats, devices, alerts }) {
  const totalDev = stats.total_devices || stats.ot_devices || devices.length;
  const activeAlt = stats.active_alerts || stats.open_alerts || alerts.length;
  const criticalAlt = stats.critical_alerts || stats.high_severity || 0;
  const riskScore = Number(stats.average_risk_score || stats.risk_score || 0).toFixed(0);

  return (
    <div className="stats">
      <StatItem
        icon="◈"
        label="MONITORED ASSETS"
        value={totalDev}
        detail={`${stats.online_devices || 0} online & active`}
        trend="Stable"
      />
      <StatItem
        icon="⚠"
        label="ACTIVE ALERTS"
        value={activeAlt}
        detail="Requires SOC review"
        trend={activeAlt > 0 ? "Elevated" : "Normal"}
        alertState={activeAlt > 0}
      />
      <StatItem
        icon="⚡"
        label="CRITICAL SEVERITY"
        value={criticalAlt}
        detail={`${stats.high_alerts || 0} high priority`}
        trend={criticalAlt > 0 ? "Critical" : "Secure"}
        alertState={criticalAlt > 0}
      />
      <StatItem
        icon="◉"
        label="GRID RISK INDEX"
        value={`${riskScore}%`}
        detail="Average threat score"
        trend={riskScore > 50 ? "High Risk" : "Optimal"}
      />
    </div>
  );
}

function StatItem({ icon, label, value, detail, trend, alertState }) {
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