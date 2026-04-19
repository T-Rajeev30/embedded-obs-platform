#ifndef OBS_AGENT_H
#define OBS_AGENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include "soc/soc.h"           
#include "soc/rtc_cntl_reg.h"  
#include <esp_wifi.h>           

using namespace websockets;

class ObsAgent {
private:
    WebsocketsClient _client;
    String _deviceName;
    String _sessionId;
    const char* _wsUrl;
    
    // Throttling State
    unsigned long _lastHeartbeat = 0;
    unsigned long _heartbeatInterval = 30000; // 30s for INFO

    void _dispatch(String level, String message, bool isMetric = false) {
        if (!_client.available()) return;

        StaticJsonDocument<256> doc;
        doc["sid"]  = _sessionId;
        doc["dev"]  = _deviceName;
        doc["lvl"]  = level;
        doc["msg"]  = message;
        doc["up"]   = millis() / 1000; 
        if (isMetric) doc["type"] = "METRIC";

        String payload;
        serializeJson(doc, payload);
        _client.send(payload);
    }

public:
    ObsAgent(String name) : _deviceName(name) {
        _sessionId = "sess_" + String(random(1000, 9999));
    }

    void begin(const char* ssid, const char* password, const char* url) {
        _wsUrl = url;
        WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
        esp_wifi_set_max_tx_power(44); 

        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) { delay(500); }
        
        _client.connect(_wsUrl);
        log("SYSTEM", "Observability Agent Active");
    }

    // High Priority: Metrics (Usually for the Chart)
    void metric(String name, float value)  { 
        _dispatch("DATA", name + ":" + String(value), true); 
    }

    // Low Priority: Only sends if 30s have passed to prevent DB bloat
    void heartbeat(String message) {
        if (millis() - _lastHeartbeat > _heartbeatInterval) {
            _dispatch("INFO", message);
            _lastHeartbeat = millis();
        }
    }

    // Utility: Manual log (use sparingly)
    void log(String level, String message) { _dispatch(level, message); }

    void tick() {
        if (!_client.available()) { _client.connect(_wsUrl); }
        _client.poll();
    }
};

#endif