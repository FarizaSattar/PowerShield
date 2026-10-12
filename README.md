# 🛡️ PowerShield
**A mini Security Operations Center for the power grid**

## 👋 What is this?

Power utilities are going digital fast — smart meters, SCADA systems, RTUs, and IoT sensors are now everywhere on the grid. But that connectivity comes with a catch: it opens the door to cyberattacks on critical infrastructure, and most student projects never touch this space.

PowerShield is my answer to that gap. It's an AI-powered cybersecurity monitoring platform that watches smart grid communication traffic in real time, flags suspicious behavior, and gives operators a live dashboard to see exactly what's happening across their network — before a "weird reading" turns into a real problem.

## ❓ Why I built this

Coming from a power systems background, I kept seeing the same disconnect: cybersecurity tools are built by security people who don't know substations, and grid tools are built by power engineers who don't think about attackers. I wanted to build something that speaks both languages — a system that understands what "normal" grid behavior looks like (voltage, frequency, load patterns) *and* what a network intrusion looks like, and can tell the difference between a faulty sensor and someone tampering with your data.

## 🚀 What it actually does

Once it's running, PowerShield works quietly in the background:

- Simulates smart grid devices (RTUs, PLCs, smart meters) talking over **MQTT**, **Modbus TCP**, and **DNP3**
- Captures and inspects network traffic using **Zeek** and **Suricata**
- Runs an **Isolation Forest** anomaly detection model over voltage, current, frequency, and packet-rate data
- Flags **False Data Injection Attacks** — e.g. catching a transformer reporting 180kV when it should read 230kV
- Detects network-level anomalies: unknown devices joining, command flooding, unauthorized SCADA commands
- Surfaces everything on a live **React** dashboard: system status, device health, and a running threat timeline
- Scores every event with a **0–100 risk score** so operators know what to act on first

## 📈 A quick example

Say an attacker spoofs a transformer's voltage reading, changing it from 230kV to 180kV to mask an actual fault.

PowerShield's detection engine flags the sudden, statistically abnormal deviation, cross-checks it against expected device behavior, and raises a **HIGH severity** alert — "Possible data manipulation, Transformer RTU-04" — on the dashboard within seconds, with a full timeline of what changed and when.

That's the difference between an operator finding out about a compromised transformer from a report next week, and finding out from a red alert while it's happening.

## 👥 Who this is for

- Utility engineers and grid operators who want visibility into cyber-physical threats
- Cybersecurity engineers curious about OT/ICS security and industrial protocols
- ML practitioners interested in anomaly detection on time-series sensor data
- Students learning how SCADA, IoT, and network security intersect in the real world

## 🛠️ What you'll need to run it

**Software:** Python 3.12, Node.js (v18+), Docker, Git

**Built with:** Python · Flask · React · MQTT · Zeek · Suricata · PostgreSQL · InfluxDB · Scikit-learn · Docker

**Helpful background:** basic networking concepts, REST APIs, and familiarity with SCADA/industrial protocols — though the setup docs walk through it either way.

## 💡 How it flows, visually

```
Smart Grid Simulator (RTU / PLC / Meter)
        │
        ▼
   MQTT / Modbus / DNP3
        │
        ▼
  Packet Capture (Zeek + Suricata)
        │
        ▼
  ┌─────────────┴─────────────┐
  │                           │
Network Monitoring      Time-Series Storage
  │                           │
  ▼
ML Threat Detection (Isolation Forest)
        │
        ▼
     Flask API
        │
        ▼
  React Dashboard ──► Risk Score + Alert
```

## ⚠️ A quick honest note

PowerShield simulates smart grid devices and traffic rather than connecting to a real utility network (for obvious reasons — no one hands a student SCADA access). The detection models are trained on simulated normal/attack data, not live utility telemetry. It's built to demonstrate the architecture and reasoning behind grid cybersecurity monitoring, not to replace a production SOC.

## 🧰 Built with

Python · Flask · React · TypeScript · MQTT · Zeek · Suricata · PostgreSQL · InfluxDB · Scikit-learn · Docker

---

*Built by [Fariza Sattar](https://github.com/FarizaSattar)
