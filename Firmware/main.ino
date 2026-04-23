/*
 * Embedded Observability Platform — Basic Logging Example
 * ---------------------------------------------------------
 * Minimal ESP32 sketch that streams a heartbeat and a heap
 * metric to the relay server over WebSockets using the
 * ObsAgent SDK.
 *
 * Before flashing:
 *   1. Update WIFI_SSID / WIFI_PASS with your network credentials.
 *   2. Update WS_URL with your laptop's LAN IP (find via `ipconfig`
 *      on Windows, `ifconfig` / `ip a` on macOS/Linux).
 *      Keep port 8080 — that is the relay's device-facing port.
 *   3. Make sure the relay server is running:
 *        cd backend && npm install && npm start
 *
 * Required Arduino libraries:
 *   - ArduinoWebsockets   by Gil Maimon
 *   - ArduinoJson         by Benoit Blanchon
 *
 * Open Serial Monitor at 115200 baud after flashing.
 */

#include "ObsAgent.h"

// ---- USER CONFIG ---------------------------------------------------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* WS_URL    = "ws://192.168.1.100:8080";  // <- your laptop IP
// --------------------------------------------------------------------

// Give this device a unique, human-readable name. It is the label
// you will see in the dashboard.
ObsAgent obs("ESP32-BWH-01");

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[BOOT] Starting Embedded Observability Agent...");

  // Connects to Wi-Fi and opens the WebSocket to the relay.
  obs.begin(WIFI_SSID, WIFI_PASS, WS_URL);

  Serial.println("[BOOT] Agent online. Streaming to relay.");
}

void loop() {
  // Required: services the WebSocket every loop. Non-blocking.
  obs.tick();

  // Low-priority liveness ping. Internally rate-limited to 30s
  // so it will not spam the database.
  obs.heartbeat("System OK");

  // Example metric: free heap in kilobytes. Shows up live on the
  // dashboard's memory telemetry chart.
  obs.metric("heap_kb", ESP.getFreeHeap() / 1024.0);

  delay(1000);
}
