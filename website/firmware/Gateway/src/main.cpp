#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <LoRa.h>
#include <SD.h>
#include <SPI.h>
#include <WebSocketsServer.h>
#include <WiFi.h>
#include <Wire.h>
#include <time.h>

// ================================
// PIN DEFINITIONS
// ================================

// LoRa RA-02 (Standard ESP32 VSPI)
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// OLED (I2C) - Adafruit SH110X (SH1106)
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_ADDR 0x3C
#define OLED_SDA 21
#define OLED_SCL 22

// LEDs & Buzzer (AyuLink Standard)
#define LED_GREEN 12
#define LED_BLUE 13
#define LED_RED 4
#define BUZZER_PIN 25

// Sensors
#define DHT_PIN 32
#define DHT_TYPE DHT22

// NTP Settings (India Time)
const char *NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 19800; // UTC +5:30
const int DAYLIGHT_OFFSET_SEC = 0;

// ================================
// CONFIGURATION
// ================================

const char *HOME_SSID = "WiFi";
const char *HOME_PASS = "wordpass";
const char *AP_SSID = "AyuLink_Gateway";
const char *AP_PASS = "ayulink123";

// ================================
// GLOBAL OBJECTS
// ================================

Adafruit_SH1106G display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
DHT dht(DHT_PIN, DHT_TYPE);
WebSocketsServer webSocket = WebSocketsServer(81);

// Gateway State
float gatewayTemp = 0.0;
float cpuTemp = 0.0; // Internal ESP32 Temp
float gatewayHumidity = 0.0;
unsigned long lastDisplayUpdate = 0;
unsigned long gatewayStartTime = 0;
int displayPage = 0;
const int TOTAL_PAGES = 5; // Pages: 0=Vitals 1=GW Status 2=LoRa 3=Alert Log 4=Sim
int totalPackets = 0;
int totalAlerts = 0;
bool simulationMode = false;
int loraRssi = 0;
int loraSnr = 0;

// Patient State (Last Packet)
String p_node = "--";
int p_hr = 0;
int p_oxy = 0;
bool p_sos = false;
bool p_fall = false;
bool p_worn = false;
String p_timestamp = "--:--:--";

// --- Simulated Patient Registry (for Expo Demo) ---
struct SimPatient {
  String name;
  int hr;
  int oxy;
  unsigned long lastSeen;
  bool active;
};

#define MAX_SIM_PATIENTS 50
SimPatient activeSims[MAX_SIM_PATIENTS]; // Support up to 50 simulated nodes
int currentSimIdx = 0;
unsigned long lastSimRotation = 0;

// Forward declarations
String getTimestamp();
void updateDisplay();

void updateSimRegistry(String node, int hr, int oxy) {
  bool found = false;
  for (int i = 0; i < MAX_SIM_PATIENTS; i++) {
    if (activeSims[i].active && activeSims[i].name == node) {
      activeSims[i].hr = hr;
      activeSims[i].oxy = oxy;
      activeSims[i].lastSeen = millis();
      found = true;
      break;
    }
  }
  if (!found) {
    for (int i = 0; i < MAX_SIM_PATIENTS; i++) {
      if (!activeSims[i].active) {
        activeSims[i].name = node;
        activeSims[i].hr = hr;
        activeSims[i].oxy = oxy;
        activeSims[i].lastSeen = millis();
        activeSims[i].active = true;
        break;
      }
    }
  }
}

void handleSimRotation() {
  if (!simulationMode) return;
  
  // Count active sim patients
  int totalActive = 0;
  for (int i = 0; i < MAX_SIM_PATIENTS; i++) if (activeSims[i].active) totalActive++;
  
  if (totalActive == 0) return;

  if (millis() - lastSimRotation > 2000) {
    // Find next active index
    int nextIdx = (currentSimIdx + 1) % MAX_SIM_PATIENTS;
    for (int i = 0; i < MAX_SIM_PATIENTS; i++) {
      int checkIdx = (nextIdx + i) % MAX_SIM_PATIENTS;
      if (activeSims[checkIdx].active) {
        currentSimIdx = checkIdx;
        break;
      }
    }
    
    // Sync globals with the rotating patient for Page 0
    p_node = activeSims[currentSimIdx].name;
    p_hr   = activeSims[currentSimIdx].hr;
    p_oxy  = activeSims[currentSimIdx].oxy;
    p_worn = true;
    p_timestamp = getTimestamp();
    
    lastSimRotation = millis();
    updateDisplay();
  }
}

// Alert History Ring Buffer (last 3 alerts)
struct Alert {
  String type;
  String node;
  String time;
};
Alert alertHistory[3];
int alertCount = 0;

// ================================
// FUNCTION DECLARATIONS
// ================================

void setupLoRa();
void setupOLED();
void setupNTP();
void setupDHT();
void processPacket(String packet);
String getTimestamp();
String getUptime();
void updateDisplay();
void drawPage_Vitals();
void drawPage_GatewayStatus();
void drawPage_LoRaStats();
void drawPage_AlertLog();
void drawPage_SimMode();
void drawEmergencyOverlay();
void drawStatusBar();
void drawSignalBars(int x, int y, int rssi);
void triggerAlarm(bool specificPattern);
extern "C" uint8_t temprature_sens_read(); // For internal ESP32 temp

void setup() {
  gatewayStartTime = millis();
  Serial.begin(115200);
  Serial.println("\n--- AyuLink Gateway Starting ---");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setupOLED();
  setupDHT();
  setupLoRa();

  // WiFi Setup
  Serial.print("[WiFi] Connecting: ");
  Serial.println(HOME_SSID);

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(HOME_SSID, HOME_PASS);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    digitalWrite(LED_BLUE, HIGH); // WiFi OK
    setupNTP();
  } else {
    Serial.println("\n[WiFi] Failed! Operating in AP Mode.");
    digitalWrite(LED_BLUE, LOW);
  }

  WiFi.softAP(AP_SSID, AP_PASS);
  webSocket.begin();
}

void loop() {
  webSocket.loop();
  
  // Simulation Patient Rotation (3-second interval)
  handleSimRotation();

  // Check LoRa
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String packet = "";
    while (LoRa.available()) {
      packet += (char)LoRa.read();
    }
    totalPackets++;
    processPacket(packet);
  }

  // Check Serial for Commands (from PC Bridge)
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.startsWith("[CMD]")) {
      String payload = input.substring(5);
      
      StaticJsonDocument<256> cmdDoc;
      DeserializationError err = deserializeJson(cmdDoc, payload);
      
      if (!err && cmdDoc["target"].as<String>() == "GATEWAY") {
        // Internal Command Handling
        String action = cmdDoc["cmd"].as<String>();
        if (action == "update_vitals") {
          String node = cmdDoc["node"].as<String>();
          int hr      = cmdDoc["hr"].as<int>();
          int oxy     = cmdDoc["oxy"].as<int>();
          
          updateSimRegistry(node, hr, oxy);
          
          simulationMode = true; 
          Serial.println("[GW] Sim Registry Update: " + node + " HR:" + String(hr));
          
          // Force immediate view update if this is the first patient
          if (p_node == "" || p_node == "--") {
            p_node = node; p_hr = hr; p_oxy = oxy; p_worn = true;
          }
          updateDisplay();
        }
      } else {
        // Standard LoRa Relay
        Serial.println("[RELAY] -> LoRa: " + payload);
        LoRa.beginPacket();
        LoRa.print(payload);
        LoRa.endPacket();
      }

      // Blue LED flash on TX/CMD Activity
      digitalWrite(LED_BLUE, HIGH); delay(50); digitalWrite(LED_BLUE, LOW);

    } else if (input == "[SIM:ON]") {
      simulationMode = true;
      Serial.println("[GW] Simulation Mode: ON");
      displayPage = 4; // Jump to Sim page

    } else if (input == "[SIM:OFF]") {
      simulationMode = false;
      Serial.println("[GW] Simulation Mode: OFF");
      displayPage = 0;

    } else if (input == "[PAGE:NEXT]") {
      displayPage = (displayPage + 1) % TOTAL_PAGES;

    } else if (input == "[RESET:ALERTS]") {
      alertCount = 0;
      p_sos = false;
      p_fall = false;
      Serial.println("[GW] Alerts cleared.");
    }
  }

  // Update Sensors every 5s
  static unsigned long lastSensors = 0;
  if (millis() - lastSensors > 5000) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) gatewayTemp = t;
    if (!isnan(h)) gatewayHumidity = h;
    
    // Read Internal ESP32 CPU Temp (convert to Celsius)
    #ifdef SOC_TEMP_SENSOR_SUPPORTED
      // Modern ESP32 API
    #else
      // Classic ESP32 internal sensor
      cpuTemp = (temprature_sens_read() - 32) / 1.8;
    #endif

    lastSensors = millis();
  }

  // Cycle Display Pages (3s each; emergency overrides inside updateDisplay)
  // PAUSE page rotation in Simulation Mode — handleSimRotation() drives the display
  if (millis() - lastDisplayUpdate > 3000) {
    if (!p_sos && !p_fall && !simulationMode) {
      displayPage = (displayPage + 1) % TOTAL_PAGES;
    }
    updateDisplay();
    lastDisplayUpdate = millis();
  }
}

void setupLoRa() {
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("[LoRa] FAILED!");
    // Error Blink
    while (1) {
      digitalWrite(LED_RED, HIGH);
      delay(100);
      digitalWrite(LED_RED, LOW);
      delay(100);
    }
  }
  LoRa.setSpreadingFactor(7);
  Serial.println("[LoRa] OK (433MHz)");
}

void setupOLED() {
  if (!display.begin(OLED_ADDR, true)) {
    Serial.println("[OLED] FAILED!");
    return;
  }
  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("AYULINK GATEWAY");
  display.display();
}

void setupNTP() {
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("[NTP] OK");
  }
}

void setupDHT() { dht.begin(); }

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo))
    return "00:00:00";
  char buf[25];
  sprintf(buf, "%02d:%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min,
          timeinfo.tm_sec);
  return String(buf);
}

void processPacket(String packet) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, packet);

  if (error) {
    Serial.println("[LoRa] Invalid JSON");
    return;
  }

  // Extract Data
  p_node      = doc["node"].as<String>();
  p_hr        = doc["hr"];
  p_oxy       = doc["oxy"];
  p_sos       = doc["sos"];
  p_fall      = doc["fall"];
  p_worn      = doc["worn"];
  p_timestamp = getTimestamp();

  // Capture live LoRa signal quality
  loraRssi = LoRa.packetRssi();
  loraSnr  = (int)LoRa.packetSnr();

  // Add Gateway Metadata
  doc["rssi"]        = loraRssi;
  doc["snr"]         = loraSnr;
  doc["timestamp"]   = p_timestamp;
  doc["gatewayTemp"] = gatewayTemp;
  doc["simMode"]     = simulationMode;
  doc["uptime"]      = getUptime();
  doc["totalPkts"]   = totalPackets;
  doc["tempSource"]  = isnan(dht.readTemperature()) ? "internal" : "dht22";

  // Determine alert type
  String type = "vitals";
  if      (doc["sos"])  type = "sos";
  else if (doc["fall"]) type = "fall";
  else if (doc["call"]) type = "call";
  doc["type"] = type;

  // --- Alert History Ring Buffer ---
  if (p_sos || p_fall) {
    Alert a;
    a.type = p_sos ? "SOS" : "FALL";
    a.node = p_node.length() > 0 ? p_node : "?";
    a.time = p_timestamp;
    alertHistory[alertCount % 3] = a;
    alertCount++;
    totalAlerts++;
    // Jump OLED to emergency immediately (updateDisplay handles the overlay)
    displayPage = 0;
  }

  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT(output);
  Serial.println("[DATA] " + output);

  // Local Alerts
  if (p_sos || p_fall) {
    triggerAlarm(p_fall); // Pattern based on type
  } else if (doc["call"]) {
    // Friendly Ringtone for Call Request
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(50);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(200);
    }
  } else {
    // Normal Packet
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(50);
    digitalWrite(LED_GREEN, LOW);
  }

  // Force Display Update Immediately on Event
  updateDisplay();
}

void triggerAlarm(bool isFall) {
  digitalWrite(LED_RED, HIGH);

  // Buzzer Logic
  if (isFall) { // Beep-Beep-Beep (Fast)
    for (int i = 0; i < 5; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(100);
    }
  } else { // SOS: Continuous Siren-like
    digitalWrite(BUZZER_PIN, HIGH);
    delay(1000);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void updateDisplay() {
  display.clearDisplay();

  // === EMERGENCY OVERRIDE (always shown first) ===
  if (p_sos || p_fall) {
    drawEmergencyOverlay();
    return;
  }

  // === STATUS BAR (top 9px on every normal page) ===
  drawStatusBar();

  // === ROTATING PAGES ===
  display.setCursor(0, 11);
  switch (displayPage) {
    case 0: drawPage_Vitals();         break;
    case 1: drawPage_GatewayStatus();  break;
    case 2: drawPage_LoRaStats();      break;
    case 3: drawPage_AlertLog();       break;
    case 4: drawPage_SimMode();        break;
  }

  // === PAGE INDICATOR DOTS (bottom row) ===
  int dotX = 128 / 2 - (TOTAL_PAGES * 5) / 2;
  for (int i = 0; i < TOTAL_PAGES; i++) {
    if (i == displayPage)
      display.fillCircle(dotX + i * 5, 62, 2, SH110X_WHITE);
    else
      display.drawCircle(dotX + i * 5, 62, 2, SH110X_WHITE);
  }

  display.display();
}

// ─────────────────────────────────────────────
// STATUS BAR: top strip with time, wifi, signal
// ─────────────────────────────────────────────
void drawStatusBar() {
  display.fillRect(0, 0, 128, 9, SH110X_WHITE);
  display.setTextColor(SH110X_BLACK);
  display.setTextSize(1);
  display.setCursor(1, 1);
  display.print(p_timestamp);

  // WiFi icon area
  String wifiStr = (WiFi.status() == WL_CONNECTED) ? "W" : "A";
  display.setCursor(60, 1);
  display.print(wifiStr);

  // Signal bars for LoRa
  drawSignalBars(80, 1, loraRssi);

  // Sim tag
  if (simulationMode) {
    display.setCursor(100, 1);
    display.print("SIM");
  }

  display.setTextColor(SH110X_WHITE); // reset color
}

// ─────────────────────────────────────────────
//  PAGE 0: PATIENT VITALS
// ─────────────────────────────────────────────
void drawPage_Vitals() {
  // Title
  display.setTextSize(1);
  display.setCursor(0, 11);
  if (simulationMode) {
    display.print("SIM PATIENT: ");
  } else {
    display.print("VITALS: ");
  }
  display.print(p_node.substring(0, 8));

  // Large HR
  display.setCursor(0, 21);
  display.setTextSize(2);
  bool hrAlert = (p_hr > 110 || p_hr < 50);
  display.print("HR:");
  display.print((p_worn || simulationMode) ? String(p_hr) : "---");

  // Large SpO2
  display.setCursor(0, 39);
  bool o2Alert = (p_oxy < 90);
  display.setTextSize(2);
  display.print("O2:");
  display.print((p_worn || simulationMode) ? (String(p_oxy) + "%") : "--");

  // Worn status badge (right side)
  display.setTextSize(1);
  display.setCursor(96, 21);
  if (p_worn) {
    display.fillRoundRect(95, 20, 32, 10, 2, SH110X_WHITE);
    display.setTextColor(SH110X_BLACK);
    display.print(" ON ");
    display.setTextColor(SH110X_WHITE);
  } else {
    display.drawRoundRect(95, 20, 32, 10, 2, SH110X_WHITE);
    display.setCursor(96, 21);
    display.print("OFF");
  }

  // Alert flash for critical vitals
  if (hrAlert || o2Alert) {
    static bool flashState = false;
    flashState = !flashState;
    if (flashState) display.drawRect(0, 10, 128, 52, SH110X_WHITE);
  }
}

// ─────────────────────────────────────────────
//  PAGE 1: GATEWAY STATUS
// ─────────────────────────────────────────────
void drawPage_GatewayStatus() {
  display.setTextSize(1);
  display.setCursor(0, 11);
  display.println("GATEWAY STATUS");
  display.drawLine(0, 20, 128, 20, SH110X_WHITE);

  display.setCursor(0, 23);
  display.print("WiFi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "Connected" : "AP Mode");

  display.print("IP:   ");
  if (WiFi.status() == WL_CONNECTED) {
    display.println(WiFi.localIP().toString().substring(0, 14));
  } else {
    display.println(WiFi.softAPIP().toString().substring(0, 14));
  }

  display.print("CPU T: ");
  display.print(cpuTemp, 1);
  display.println("C");

  display.print("UpTime: ");
  display.println(getUptime());
}

// ─────────────────────────────────────────────
//  PAGE 2: LoRa NETWORK STATS
// ─────────────────────────────────────────────
void drawPage_LoRaStats() {
  display.setTextSize(1);
  display.setCursor(0, 11);
  display.println("LoRa 433MHz MESH");
  display.drawLine(0, 20, 128, 20, SH110X_WHITE);

  display.setCursor(0, 23);
  display.print("Packets: ");
  display.println(totalPackets);

  display.print("Alerts:  ");
  display.println(totalAlerts);

  display.print("RSSI:    ");
  display.print(loraRssi);
  display.println(" dBm");

  // Visual signal bar graph
  display.setCursor(0, 52);
  display.print("Sig:");
  int bars = 0;
  if      (loraRssi > -60) bars = 5;
  else if (loraRssi > -70) bars = 4;
  else if (loraRssi > -80) bars = 3;
  else if (loraRssi > -90) bars = 2;
  else if (loraRssi > -100) bars = 1;
  for (int i = 0; i < 5; i++) {
    if (i < bars)
      display.fillRect(32 + i * 8, 52 - i, 5, 3 + i, SH110X_WHITE);
    else
      display.drawRect(32 + i * 8, 52 - i, 5, 3 + i, SH110X_WHITE);
  }
}

// ─────────────────────────────────────────────
//  PAGE 3: ALERT LOG (last 3)
// ─────────────────────────────────────────────
void drawPage_AlertLog() {
  display.setTextSize(1);
  display.setCursor(0, 11);
  display.println("ALERT LOG");
  display.drawLine(0, 20, 128, 20, SH110X_WHITE);

  if (alertCount == 0) {
    display.setCursor(20, 35);
    display.println("No alerts. All OK.");
    return;
  }

  // Show last 3 in reverse order
  int shown = 0;
  for (int i = alertCount - 1; i >= 0 && shown < 3; i--) {
    int idx = i % 3;
    display.setCursor(0, 23 + shown * 12);
    display.print(alertHistory[idx].type.substring(0, 5));
    display.print(" ");
    display.print(alertHistory[idx].node.substring(0, 6));
    display.print(" ");
    display.print(alertHistory[idx].time);
    shown++;
  }
}

// ─────────────────────────────────────────────
//  PAGE 4: SIMULATION MODE INFO
// ─────────────────────────────────────────────
void drawPage_SimMode() {
  display.setTextSize(1);
  display.setCursor(0, 11);

  if (!simulationMode) {
    display.println("SIM: INACTIVE");
    display.drawLine(0, 20, 128, 20, SH110X_WHITE);
    display.setCursor(0, 25);
    display.println("Send [SIM:ON] over");
    display.println("serial to activate.");
    return;
  }

  // Animated SIM header
  static int animTick = 0;
  animTick++;
  String header = "SIM MODE";
  String dots = (animTick % 4 == 0) ? "." :
                (animTick % 4 == 1) ? ".." :
                (animTick % 4 == 2) ? "..." : "";
  display.println(header + dots);
  display.drawLine(0, 20, 128, 20, SH110X_WHITE);
  display.setCursor(0, 23);
  display.print("Node: ");
  display.println(p_node);
  display.print("Pkts: ");
  display.println(totalPackets);
  display.print("HR:   ");
  display.print(p_hr);
  display.print("  O2:");
  display.println(p_oxy);

  // Scrolling live indicator at bottom
  display.setCursor(0, 53);
  const char* ticker = ">> LIVE SIMULATION DATA >>";
  int offset = (millis() / 200) % strlen(ticker);
  display.print(ticker + offset);
}

// ─────────────────────────────────────────────
//  EMERGENCY FULL-SCREEN OVERLAY
// ─────────────────────────────────────────────
void drawEmergencyOverlay() {
  static bool blinkState = false;
  blinkState = !blinkState;

  // Strobe background invert
  if (blinkState) display.fillRect(0, 0, 128, 64, SH110X_WHITE);
  display.setTextColor(blinkState ? SH110X_BLACK : SH110X_WHITE);

  // Big alert header
  display.setTextSize(2);
  display.setCursor(p_fall ? 4 : 16, 2);
  display.println(p_fall ? "!! FALL !" : "!! SOS !!");

  // Divider
  display.setTextColor(blinkState ? SH110X_BLACK : SH110X_WHITE);
  display.drawLine(0, 22, 128, 22, blinkState ? SH110X_BLACK : SH110X_WHITE);

  // Details
  display.setTextSize(1);
  display.setCursor(0, 25);
  display.print("Node : ");
  display.println(p_node);
  display.print("HR   : ");
  display.print(p_hr);
  display.print("  O2: ");
  display.println(p_oxy);
  display.print("RSSI : ");
  display.print(loraRssi);
  display.println(" dBm");
  display.print("Time : ");
  display.println(p_timestamp);

  // Flashing border on even blink
  if (!blinkState)
    display.drawRect(0, 0, 128, 64, SH110X_WHITE);

  display.setTextColor(SH110X_WHITE); // reset
  display.display();
}

// ─────────────────────────────────────────────
//  HELPER: Draw LoRa signal bars (xs, ys)
// ─────────────────────────────────────────────
void drawSignalBars(int x, int y, int rssi) {
  int bars = 0;
  if      (rssi == 0)    bars = 0;
  else if (rssi > -60)   bars = 4;
  else if (rssi > -75)   bars = 3;
  else if (rssi > -90)   bars = 2;
  else                   bars = 1;
  for (int i = 0; i < 4; i++) {
    if (i < bars)
      display.fillRect(x + i * 4, y + (3 - i), 3, 1 + i, SH110X_BLACK);
    else
      display.drawRect(x + i * 4, y + (3 - i), 3, 1 + i, SH110X_BLACK);
  }
}

// ─────────────────────────────────────────────
//  HELPER: Human-readable uptime
// ─────────────────────────────────────────────
String getUptime() {
  unsigned long sec = (millis() - gatewayStartTime) / 1000;
  int h = sec / 3600;
  int m = (sec % 3600) / 60;
  int s = sec % 60;
  char buf[12];
  sprintf(buf, "%02d:%02d:%02d", h, m, s);
  return String(buf);
}
