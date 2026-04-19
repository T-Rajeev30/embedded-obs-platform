# 🔭 Embedded Observability Platform

> **Sentry for Hardware.** Remote debugging, real-time telemetry, and session replay for ESP32, STM32, and Raspberry Pi — from any browser, anywhere in the world.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-ESP32%20%7C%20STM32%20%7C%20RPi-blue)]()
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20WebSockets%20%2B%20C%2B%2B-green)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-orange)]()

---

## 🧭 Table of Contents

- [The Problem](#-the-problem)
- [What This Builds](#-what-this-builds)
- [System Architecture](#-system-architecture)
- [Data Flow](#-data-flow-end-to-end)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Relay Server Setup](#1-relay-server-setup)
  - [Firmware SDK Setup](#2-firmware-sdk-esp32)
  - [Dashboard Setup](#3-dashboard-coming-week-3)
- [The Firmware SDK](#-the-firmware-sdk-obsagent)
- [API Reference](#-api-reference)
- [Roadmap](#-roadmap)
- [Business Model](#-business-model)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔥 The Problem

Embedded debugging today is **primitive** compared to modern software observability.

| What Web Devs Have | What Hardware Devs Have |
|---|---|
| Sentry — crash reports with stack traces | `printf` over USB cable |
| Datadog — real-time metrics dashboards | LED blinks and guesswork |
| LogRocket — session replay | "It worked in the lab" |
| Remote SSH access | Physical access required |

When an IoT device fails in the field, the typical workflow is:

```
Device fails → Customer reports vague issue → Engineer can't reproduce →
Add debug prints → Re-flash firmware → Ship new build → Wait for failure → Repeat
```

Each cycle can take **hours to days**. This platform eliminates that loop entirely.

---

## 🏗️ What This Builds

A cloud platform that gives microcontrollers their own **black box flight recorder**.

| Feature | Description |
|---|---|
| 📡 **Remote Log Streaming** | Real-time device logs visible in any browser |
| 🗂️ **Session History** | Every boot is a "session" with its own context |
| 📊 **Health Metrics** | Track heap memory, battery voltage, signal strength |
| 💾 **Config Snapshots** | Store firmware version and runtime parameters at crash time |
| 🔁 **Remote Restart** | Trigger reboots or diagnostic modes from the dashboard |
| 🧠 **RL Anomaly Detection** | Learn what "normal" looks like and flag deviations *(Week 5)* |

---

## ⚙️ System Architecture

The platform is split into three decoupled tiers:

```
┌─────────────────────────────────────────────────────────┐
│                    TIER 1: THE EDGE                      │
│                                                          │
│   ┌──────────────┐    ┌──────────────┐                  │
│   │   ESP32      │    │  Raspberry   │                  │
│   │  + ObsAgent  │    │  Pi + Agent  │                  │
│   └──────┬───────┘    └──────┬───────┘                  │
│          │ WebSocket / MQTT  │                           │
└──────────┼───────────────────┼───────────────────────────┘
           │                   │
┌──────────▼───────────────────▼───────────────────────────┐
│                   TIER 2: THE BRIDGE                      │
│                                                          │
│              ┌──────────────────────┐                   │
│              │   Node.js Relay      │                   │
│              │   WebSocket Server   │                   │
│              │   (ws://0.0.0.0:8080)│                   │
│              └──────────┬───────────┘                   │
│                         │ Parses JSON, assigns Session ID│
└─────────────────────────┼─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                   TIER 3: THE CLOUD                       │
│                                                          │
│   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐ │
│   │  MongoDB    │   │  Express API │   │ React/Next  │ │
│   │  (Sessions) │◄──│  (REST + WS) │──►│ Dashboard   │ │
│   └─────────────┘   └──────────────┘   └─────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Mental Models to Remember

| Concept | Mental Model |
|---|---|
| **WebSocket** | A phone call — the line stays open, either side can speak at any time |
| **JSON Payloads** | A standard form — every language (C++, JS, Python) knows how to read it |
| **Non-Blocking SDK** | A waiter — drops the log "plate" and returns to the kitchen (your main loop) |
| **Session ID** | A flight number — groups all logs from one boot together |
| **Encapsulation** | A car dashboard — you use the steering wheel (public API), not the pistons |

---

## 🔄 Data Flow: End to End

```
1. [FIRMWARE]  obs.log("ERROR", "I2C timeout")
                    │
                    ▼
2. [SDK]       ObsAgent formats JSON:
               {"sid":"4721","dev":"ESP32-BWH-01","lvl":"ERROR","msg":"I2C timeout","ts":34521}
                    │
                    ▼ WebSocket frame
3. [RELAY]     Node.js receives packet
               → Parses JSON
               → Broadcasts to all connected browser clients (live view)
               → Forwards to Express API for persistence
                    │
                    ▼ POST /api/logs
4. [BACKEND]   Express stores log in MongoDB under session_id: "4721"
                    │
                    ▼ WebSocket push or REST poll
5. [DASHBOARD] React renders log in timeline
               → Engineer sees: "Session 4721 → I2C Error at T+34s"
               → Can click "Replay Session" or "Remote Restart"
```

---

## 📁 Project Structure

```
embedded-obs-platform/
│
├── firmware/                   # ESP32 / STM32 / RPi SDK
│   ├── src/
│   │   ├── ObsAgent.h          # SDK header — public API declarations
│   │   └── ObsAgent.cpp        # SDK implementation — logic lives here
│   ├── examples/
│   │   ├── basic_logging/      # Minimal example for new users
│   │   └── crash_report/       # Example: detecting & reporting a crash
│   └── library.json            # Arduino / PlatformIO library metadata
│
├── relay/                      # Node.js WebSocket Bridge
│   ├── server.js               # Core relay logic
│   ├── package.json
│   └── .env.example            # Template for environment variables
│
├── backend/                    # Express REST API + MongoDB
│   ├── routes/
│   │   ├── sessions.js         # GET /api/sessions
│   │   └── logs.js             # POST /api/logs, GET /api/logs/:session_id
│   ├── models/
│   │   ├── Session.js          # Mongoose schema for sessions
│   │   └── Log.js              # Mongoose schema for log entries
│   └── index.js
│
├── dashboard/                  # Next.js + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LogStream.jsx   # Live log feed component
│   │   │   ├── MetricChart.jsx # Line chart for heap/voltage/signal
│   │   │   └── SessionList.jsx # Historical sessions panel
│   │   └── pages/
│   │       ├── index.jsx       # Main dashboard
│   │       └── session/[id].jsx # Session replay view
│   └── package.json
│
├── README.md
├── .gitignore
└── LICENSE
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Firmware** | C++ (Arduino Framework) | Runs on bare metal ESP32/STM32 |
| **Serialization** | ArduinoJson (Benoit Blanchon) | Zero-copy JSON for constrained MCUs |
| **Transport** | WebSockets (`ArduinoWebsockets`) | Full-duplex, low-latency vs HTTP |
| **Relay** | Node.js + `ws` library | Lightweight event-loop, handles 1000s of connections |
| **Database** | MongoDB (Time-Series collections) | Schema-flexible for variable log structures |
| **Backend** | Express.js | REST API for session/log history |
| **Frontend** | Next.js + React | SSR dashboard, fast initial load |
| **Charts** | Recharts | React-native charts for metric visualization |
| **Anomaly Detection** | Python + Stable-Baselines3 *(Week 5)* | RL model trained on session history |

---

## 🚀 Getting Started

### Prerequisites

**Software**
- Node.js v18+
- Arduino IDE 2.x or PlatformIO
- MongoDB (local or Atlas free tier)
- Git

**Hardware**
- ESP32 DevKit (any variant)
- USB data cable (not a charge-only cable — this matters)
- Same Wi-Fi network for device and laptop during initial setup

**Arduino Libraries** (install via Library Manager)
- `ArduinoWebsockets` by Gil Maimon
- `ArduinoJson` by Benoit Blanchon

---

### 1. Relay Server Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/embedded-obs-platform.git
cd embedded-obs-platform/relay

# Install dependencies
npm install

# Start the relay
node server.js
# Expected output: 📡 RELAY SERVER ACTIVE ON ws://0.0.0.0:8080
```

> **Windows users:** If your ESP32 cannot connect, run this in PowerShell as Administrator:
> ```powershell
> netsh advfirewall firewall add rule name="Allow ESP32 Debugger" dir=in action=allow protocol=TCP localport=8080
> ```

---

### 2. Firmware SDK (ESP32)

Open `firmware/examples/basic_logging/basic_logging.ino` in Arduino IDE.

Update these three lines:
```cpp
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ws_url   = "ws://YOUR_LAPTOP_IP:8080"; // Find with ipconfig (Wi-Fi IPv4)
```

Flash to your ESP32. Open Serial Monitor at **115200 baud**. You should see:
```
🚀 [SYSTEM] EMBEDDED OBS PLATFORM STARTING...
✅ [WIFI] Connected! IP: 10.x.x.x
🔗 [WS] Handshake Successful!
📤 [SENT] Heartbeat Log
```

On your laptop terminal (Relay Server), you should see:
```
✨ NEW DEVICE CONNECTED: 10.x.x.x
[DEBUG] System OK | uptime: 5s
[DEBUG] System OK | uptime: 10s
```

---

### 3. Dashboard *(Coming — Week 3)*

```bash
cd embedded-obs-platform/dashboard
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📦 The Firmware SDK: `ObsAgent`

The SDK is a single C++ class that hides all WebSocket and JSON complexity from your firmware code.

**How to integrate in any project:**

```cpp
#include "ObsAgent.h"

// One line to create an agent for your device
ObsAgent obs("ESP32-DRONE-01");

void setup() {
    obs.begin("ws://192.168.1.100:8080");
}

void loop() {
    obs.tick(); // Must be called in every loop — keeps the connection alive

    // Your actual project code:
    float voltage = readBattery();
    obs.metric("battery_v", voltage);

    if (voltage < 3.3) {
        obs.log("WARN", "Battery low — initiating return to home");
    }
}
```

**That's the entire integration.** Three function calls: `begin()`, `tick()`, `log()` / `metric()`.

---

## 📖 API Reference

### `ObsAgent` (C++)

| Method | Parameters | Description |
|---|---|---|
| `ObsAgent(name)` | `String name` | Creates agent. Name appears in dashboard. |
| `begin(url)` | `const char* ws_url` | Connects to relay and sends INIT event |
| `tick()` | — | **Call this every loop.** Polls WebSocket. |
| `log(level, msg)` | `String level, String msg` | Sends a log. Levels: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` |
| `metric(name, value)` | `String name, float value` | Sends a named numeric metric (e.g., heap, voltage) |

### Relay → Backend REST *(Week 3)*

| Endpoint | Method | Description |
|---|---|---|
| `/api/sessions` | GET | List all sessions, sorted by last activity |
| `/api/sessions/:id` | GET | Full session detail with all logs and metrics |
| `/api/logs` | POST | Relay pushes logs here (internal) |
| `/api/devices` | GET | List all connected/known devices |
| `/api/devices/:id/restart` | POST | Send remote restart command to device |

### JSON Payload Schema

Every packet from the SDK looks like this:

```json
{
  "sid":  "4721",
  "dev":  "ESP32-DRONE-01",
  "lvl":  "ERROR",
  "msg":  "I2C timeout on address 0x68",
  "ts":   34521,
  "type": "LOG"
}
```

Metric packets add one field: `"type": "METRIC"` and the `msg` field becomes `"name:value"` (e.g., `"battery_v:3.71"`).

---

## 🗺️ Roadmap

### ✅ Week 1 — The Wire
- [x] WebSocket relay server (Node.js)
- [x] ESP32 WebSocket client with power management (BOD bypass, TX throttle)
- [x] Bi-directional communication (device ↔ cloud)
- [x] JSON heartbeat with uptime

### 🔄 Week 2 — The Firmware SDK *(In Progress)*
- [ ] `ObsAgent` C++ class (`.h` / `.cpp` split)
- [ ] Session ID generation on boot
- [ ] Structured log levels: DEBUG / INFO / WARN / ERROR / FATAL
- [ ] Metric tracking for numeric values
- [ ] Circular RAM buffer for pre-crash log retention
- [ ] Auto-reconnect on Wi-Fi drop

### 📋 Week 3 — The Cloud Brain
- [ ] MongoDB schemas: `Session`, `Log`, `Device`
- [ ] Express REST API (`/api/sessions`, `/api/logs`)
- [ ] Relay → Backend pipeline (relay POSTs logs to Express)
- [ ] Session grouping by `session_id`

### 📊 Week 4 — The Dashboard
- [ ] Next.js dashboard scaffold
- [ ] Live log stream (WebSocket from relay to browser)
- [ ] Session timeline view (replay what happened before crash)
- [ ] Metric charts (Recharts line graph for heap/voltage)
- [ ] Device status panel

### 🧠 Week 5 — The Intelligence Layer
- [ ] Session feature extraction pipeline (Python)
- [ ] RL anomaly detection model (DQN on session sequences)
- [ ] "Potential crash imminent" warning in dashboard
- [ ] Model training loop on historical session data

### 🚢 Week 6 — Production & Launch
- [ ] JWT authentication (engineer login)
- [ ] Remote restart command (Web → Relay → ESP32)
- [ ] Multi-tenant support (multiple users, multiple device fleets)
- [ ] Stripe billing integration (Freemium + Pro plan)
- [ ] Deployment: Railway / Render for relay, Vercel for dashboard

---

## 💰 Business Model

| Tier | Price | Devices | Features |
|---|---|---|---|
| **Hobbyist** | Free | 2 | 7-day log history, 1 session stored |
| **Pro** *(Startup)* | ₹2,000/month | 50 | 90-day history, anomaly detection, remote restart |
| **Enterprise** | Custom | Unlimited | On-premise deployment, SLA, custom integrations |

**Target customers:** IoT startups, drone manufacturers, robotics teams, hardware accelerators.

**Differentiation:** Most observability tools (Datadog, New Relic) are far too heavy for a device with 512KB RAM. This SDK was purpose-built to run on a chip smaller than a postage stamp.

---

## 🤝 Contributing

This is a **learning project** built as part of a 6-week RL + Systems curriculum. Contributions, questions, and issues are welcome.

```bash
# Fork → Clone → Create branch
git checkout -b feature/your-feature-name

# Make changes → Commit
git commit -m "feat: add STM32 HAL support to ObsAgent"

# Push → Open Pull Request
git push origin feature/your-feature-name
```

**Commit message convention:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

You are free to use this in commercial and personal projects. Attribution appreciated but not required.

---

## 👨‍💻 Built By

**Rajeev** — Electronics & Telecom Engineer, Co-founder @ Build With Hardware, GSoC 2026.

> *"The gap isn't in the algorithms. It's in knowing how to ship them."*

---

*Last updated: Week 1 complete. Relay established. ESP32 streaming heartbeats at 10.206.255.198.*