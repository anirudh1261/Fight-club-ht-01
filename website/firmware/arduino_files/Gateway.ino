#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <Adafruit_SSD1306.h> // Include both for easy switching
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <LoRa.h>
#include <SPI.h>
#include <WiFi.h>
#include <Wire.h>
#include <time.h>

// ================================
// DISPLAY SELECTION (UNCOMMENT ONE)
// ================================
// #define USE_SSD1306 // 0.96" OLED
#define USE_SH1106 // 1.3" OLED (Default in previous code)

// ================================
// PIN DEFINITIONS
// ================================

// LoRa RA-02 (Standard ESP32 VSPI)
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 26

// OLED (I2C)
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_ADDR 0x3C
#define OLED_SDA 21
#define OLED_SCL 22

// LEDs & Buzzer
#define LED_RED 13
#define LED_GREEN 12
#define LED_BLUE 14
#define BUZZER_PIN 4

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

#ifdef USE_SSD1306
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
#else
Adafruit_SH1106G display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
#endif

DHT dht(DHT_PIN, DHT_TYPE);

// Gateway State
float gatewayTemp = 0.0;
float gatewayHumidity = 0.0;
unsigned long lastDisplayUpdate = 0;
int displayPage = 0;
int totalPackets = 0;

// Patient State (Last Packet)
String p_node = "--";
int p_hr = 0;
int p_oxy = 0;
bool p_sos = false;
bool p_fall = false;
bool p_worn = false;
String p_timestamp = "";
int lastRssi = 0;

// ================================
// UI HELPERS (DRAWING)
// ================================

void drawWifiIcon(int x, int y, bool connected) {
  if (connected) {
    display.drawArc(x + 6, y + 6, 6, 0, 225, 315, 1);
    display.drawArc(x + 6, y + 6, 3, 0, 225, 315, 1);
    display.fillCircle(x + 6, y + 6, 1, 1);
  } else {
    display.drawLine(x, y + 8, x + 12, y, 1);
    display.drawLine(x, y, x + 12, y + 8, 1);
  }
}

void drawHeartIcon(int x, int y) {
  // Simple 8x8 Heart
  display.fillCircle(x + 2, y + 2, 2, 1);
  display.fillCircle(x + 5, y + 2, 2, 1);
  display.fillTriangle(x, y + 4, x + 7, y + 4, x + 3, y + 7, 1);
}

void drawSignalBars(int x, int y, int rssi) {
  // 4 Bars
  int quality = 0;
  if (rssi > -50)
    quality = 4;
  else if (rssi > -80)
    quality = 3;
  else if (rssi > -100)
    quality = 2;
  else
    quality = 1;

  for (int i = 0; i < 4; i++) {
    int h = (i + 1) * 2;
    if (i < quality)
      display.fillRect(x + (i * 3), y + (8 - h), 2, h, 1);
    else
      display.drawRect(x + (i * 3), y + (8 - h), 2, h, 1);
  }
}

void setupLoRa();
void setupOLED();
void setupNTP();
void setupDHT();
void processPacket(String packet);
String getTimestamp();
void updateDisplay();
void triggerAlarm(bool specificPattern);

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- AyuLink Gateway Starting ---");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setupOLED();
  setupDHT();
  setupLoRa();

  // Show Splash
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(15, 20);
  display.println("AyuLink");
  display.setTextSize(1);
  display.setCursor(30, 45);
  display.println("Gateway v1.0");
  display.display();
  delay(2000);

  // WiFi Setup
  Serial.print("[WiFi] Connecting: ");
  Serial.println(HOME_SSID);

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(HOME_SSID, HOME_PASS);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    if (retry % 5 == 0) {
      display.clearDisplay();
      display.setCursor(0, 20);
      display.println("Connecting WiFi...");
      display.display();
    }
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
}

void loop() {
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

  // Update Sensors
  static unsigned long lastSensors = 0;
  if (millis() - lastSensors > 5000) {
    gatewayTemp = dht.readTemperature();
    gatewayHumidity = dht.readHumidity();
    lastSensors = millis();
  }

  // Cycle Display
  if (millis() - lastDisplayUpdate > 500) { // Fast Refresh for smoothness
    if ((millis() / 3000) % 2 == 0)
      displayPage = 0;
    else
      displayPage = 1;

    updateDisplay();
    lastDisplayUpdate = millis();
  }
}

void setupLoRa() {
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("[LoRa] FAILED!");
    // Error on OLED
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("LORA ERROR!");
    display.display();
    while (1)
      ;
  }
  LoRa.setSpreadingFactor(7);
  Serial.println("[LoRa] OK (433MHz)");
}

void setupOLED() {
#ifdef USE_SSD1306
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("[OLED] FAILED!");
    return;
  }
#else
  if (!display.begin(OLED_ADDR, true)) {
    Serial.println("[OLED] FAILED!");
    return;
  }
#endif
  display.clearDisplay();
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
  p_node = doc["node"].as<String>();
  p_hr = doc["hr"];
  p_oxy = doc["oxy"];
  p_sos = doc["sos"];
  p_fall = doc["fall"];
  p_worn = doc["worn"];
  p_timestamp = getTimestamp();
  lastRssi = LoRa.packetRssi();

  doc["rssi"] = lastRssi;
  doc["timestamp"] = getTimestamp();
  doc["gatewayTemp"] = gatewayTemp;

  String output;
  serializeJson(doc, output);
  Serial.println("[DATA] " + output);

  // Local Alerts
  if (p_sos || p_fall)
    triggerAlarm(p_fall);
  else if (doc["call"]) {
    // Call Ring
    for (int i = 0; i < 2; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(100);
    }
  } else {
    // Packet Ack
    digitalWrite(LED_GREEN, HIGH);
    delay(50);
    digitalWrite(LED_GREEN, LOW);
  }

  updateDisplay();
}

void triggerAlarm(bool isFall) {
  digitalWrite(LED_RED, HIGH);
  if (isFall) {
    for (int i = 0; i < 5; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(100);
    }
  } else {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(1000);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void updateDisplay() {
  display.clearDisplay();

  // ================= TOP BAR =================
  display.drawLine(0, 10, 128, 10, 1); // Separator

  // Time (Left)
  display.setTextSize(1);
  display.setCursor(0, 0);
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    display.printf("%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
  } else {
    display.print("--:--");
  }

  // WiFi (Right)
  // Assuming 128 width, icon at 115
  drawWifiIcon(116, 0, WiFi.status() == WL_CONNECTED);

  // ================= ALERT CHECK =================
  static bool blink = false;
  blink = !blink; // Flip every call (500ms)

  if (p_sos || p_fall) {
    if (blink)
      display.invertDisplay(true);
    else
      display.invertDisplay(false);

    display.setTextSize(2);
    display.setCursor(15, 20);
    if (p_fall)
      display.println("FALL DETECT");
    else
      display.println("SOS ALERT!");

    display.setTextSize(1);
    display.setCursor(35, 45);
    display.print("NODE: ");
    display.println(p_node);

    display.display();
    return;
  }
  display.invertDisplay(false);

  // ================= MAIN CONTENT =================
  // If no data yet
  if (p_node == "--") {
    display.setCursor(25, 30);
    display.print("Scanning...");
    // Animated dots
    int dots = (millis() / 500) % 4;
    for (int i = 0; i < dots; i++)
      display.print(".");

    // Config Info
    display.setCursor(0, 55);
    display.print("AP: AyuLink_GW");
  } else {
    // Patient Data Dashboard
    display.drawRect(0, 14, 62, 36, 1);  // Box 1: Vitals
    display.drawRect(66, 14, 62, 36, 1); // Box 2: Info

    // --- Box 1: Left (Vitals) ---
    if (!p_worn) {
      display.setCursor(10, 26);
      display.print("NOT WORN");
    } else {
      // HR
      drawHeartIcon(4, 20);
      display.setCursor(16, 18);
      display.print(p_hr);

      // O2
      display.setCursor(4, 34);
      display.print("O2");
      display.setCursor(20, 34);
      display.print(p_oxy);
      display.print("%");
    }

    // --- Box 2: Right (Details) ---
    display.setCursor(70, 18);
    display.print("ID:");
    display.println(p_node);

    // Status
    display.setCursor(70, 30);
    if (p_sos)
      display.print("CRIT");
    else
      display.print("NORM");

    // RSSI Bar
    drawSignalBars(110, 30, lastRssi);
  }

  // ================= FOOTER =================
  display.drawLine(0, 54, 128, 54, 1);
  display.setCursor(0, 56);
  display.print("PKT:");
  display.print(totalPackets);

  display.setCursor(64, 56);
  display.print("Temp:");
  display.print((int)gatewayTemp);
  display.print("C");

  display.display();
}
