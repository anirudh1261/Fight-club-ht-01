#include "MAX30100_PulseOximeter.h"
#include <Adafruit_GFX.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include <LoRa.h>
#include <SPI.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <Wire.h>
#include <esp_now.h>

// --- OLED CONFIG ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- HARDWARE CONFIGURATION (ESP32 DevKit V1) ---
// Buttons
#define PIN_BUTTON_SOS 33  // BUTTON A (Red?): SOS Activate/Deactivate
#define PIN_BUTTON_FUNC 32 // BUTTON B (Green?): Page / Call / Cancel

// LEDs (Status Indicators)
#define PIN_LED_GREEN 4   // Safe / Heartbeat
#define PIN_LED_YELLOW 12 // Alert / Warning
#define PIN_LED_RED 13    // SOS / Emergency

// Haptic & Audio
#define PIN_BUZZER 15    // Active High Buzzer
#define PIN_VIB_MOTOR 27 // Vibration Motor (Transistor Driven)

// LoRa RA-02
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_NSS 5
#define LORA_RST 14
#define LORA_DIO0 26

// GPS NEO-6M
#define GPS_RX 16
#define GPS_TX 17

// Constants
#define BAND 433E6
#define NODE_ID "P_01"

// Global Objects
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
PulseOximeter pox;
Adafruit_MPU6050 mpu;

// --- STATE MANAGEMENT ---
unsigned long lastSendTime = 0;
const int SEND_INTERVAL = 3000;

// Vitals Simulation
int heartRate = 72;
int spo2 = 98;
bool isEmergency = false;
bool isCardiacEvent = false;
bool isWorn = false;
bool fallDetected = false;
int batteryLevel = 85;

// Button Logic
bool lastSosState = HIGH;
bool lastFuncState = HIGH;
unsigned long pressTimeFunc = 0;
unsigned long pressTimeSos = 0;

// UI State
int currentPage = 0; // 0=Vitals, 1=Info, 2=QR/ID
unsigned long lastDisplayUpdate = 0;

// Fall Detection State Machine
bool trigger_ff = false;
bool trigger_impact = false;
unsigned long ff_timestamp = 0;
unsigned long impact_timestamp = 0;

// ESP-NOW Structure
typedef struct struct_message {
  char type[10]; // "UPDATE"
  int slot_id;
  int hour;
  int minute;
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// --- FEEDBACK HELPERS ---
void triggerHaptic(int duration) {
  digitalWrite(PIN_VIB_MOTOR, HIGH);
  delay(duration);
  digitalWrite(PIN_VIB_MOTOR, LOW);
}

void triggerBeep(int duration) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(duration);
  digitalWrite(PIN_BUZZER, LOW);
}

// --- GPS UPDATE ---
void updateGPS() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
}

// --- SENSOR CHECKS (ADVANCED FALL DETECTION) ---
void checkFall() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Calculate Total G-Force (a.acceleration is in m/s^2, divide by 9.8 to get
  // G)
  float ax_g = a.acceleration.x / 9.8;
  float ay_g = a.acceleration.y / 9.8;
  float az_g = a.acceleration.z / 9.8;
  float total_g = sqrt(pow(ax_g, 2) + pow(ay_g, 2) + pow(az_g, 2));

  // STAGE 1: Detect Free Fall (< 0.5g)
  if (total_g < 0.5 && !trigger_ff) {
    trigger_ff = true;
    ff_timestamp = millis();
  }

  // STAGE 2: Detect Impact (> 3.0g) within 500ms of Free Fall
  if (trigger_ff) {
    if (millis() - ff_timestamp < 500) {
      if (total_g > 3.0) {
        trigger_impact = true;
        impact_timestamp = millis();
        trigger_ff = false;
        Serial.println("Stage 2: Impact Detected!");
      }
    } else {
      trigger_ff = false;
    }
  }

  // STAGE 3: Inactivity Check (Low Gyro) for 2s after Impact
  if (trigger_impact) {
    if (millis() - impact_timestamp > 2000) {
      float gx = abs(g.gyro.x);
      float gy = abs(g.gyro.y);
      float gz = abs(g.gyro.z);

      if (gx < 0.35 && gy < 0.35 && gz < 0.35) {
        if (!isEmergency) {
          Serial.println("!!! FALL CONFIRMED - NO MOVEMENT !!!");
          isEmergency = true;
          fallDetected = true;
          triggerHaptic(2000);
          triggerBeep(2000);
        }
      } else {
        Serial.println("Movement detected - Fall Cancelled");
      }
      trigger_impact = false;
    }
  }
}

// --- OLED UPDATE (PRO UI) ---
void updateDisplay() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // 1. EMERGENCY UI
  if (isEmergency) {
    display.invertDisplay(true); // FLASH SCREEN
    display.setTextSize(2);
    display.setCursor(20, 15);
    if (fallDetected)
      display.println("FALL!!");
    else
      display.println("SOS ALERT!");

    display.setTextSize(1);
    display.setCursor(10, 45);
    display.print("Sending Location...");
    display.display();
    return;
  }
  display.invertDisplay(false);

  // 2. NORMAL UI
  // Top Bar: Battery | LoRa
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Bat:");
  display.print(batteryLevel);
  display.print("%");

  display.setCursor(90, 0);
  display.print(isWorn ? "WORN" : "OFF");

  display.drawLine(0, 10, 128, 10, 1);

  // Pages
  if (currentPage == 0) { // VITALS PAGE
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.print("HR: ");
    display.println(isWorn ? heartRate : 0);
    display.setCursor(0, 45);
    display.print("SpO2:");
    display.print(isWorn ? spo2 : 0);
    display.println("%");

    // Activity Icon mockup
    display.fillCircle(115, 30, 4, 1); // Mock "Pulse" dot
  } else if (currentPage == 1) {       // INFO PAGE
    display.setTextSize(1);
    display.setCursor(0, 20);
    display.print("ID: ");
    display.println(NODE_ID);
    display.setCursor(0, 35);
    display.print("GPS: ");
    if (gps.location.isValid())
      display.println("Locked");
    else
      display.println("Searching...");
    display.setCursor(0, 50);
    display.print("Temp: ");
    display.print(36.5);
    display.println("C");
  }

  // Footer Actions
  // display.drawLine(0, 54, 128, 54, 1);

  display.display();
}

// --- STATUS INDICATORS ---
void updateIndicators() {
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  if (!isWorn) {
    static bool blinkState = false;
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      blinkState = !blinkState;
      lastBlink = millis();
    }
    digitalWrite(PIN_LED_YELLOW, blinkState ? HIGH : LOW);
    return;
  }

  if (isEmergency) {
    // SOS: Fast Red Strobe + Siren
    static bool blinkState = false;
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 100) {
      blinkState = !blinkState;
      lastBlink = millis();
      if (blinkState) {
        digitalWrite(PIN_VIB_MOTOR, HIGH);
        digitalWrite(PIN_BUZZER, HIGH);
      } else {
        digitalWrite(PIN_VIB_MOTOR, LOW);
        digitalWrite(PIN_BUZZER, LOW);
      }
    }
    digitalWrite(PIN_LED_RED, blinkState ? HIGH : LOW);
  } else {
    // Safe
    static unsigned long lastBeat = 0;
    if (millis() - lastBeat > 1000) {
      digitalWrite(PIN_LED_GREEN, HIGH);
      delay(50);
      digitalWrite(PIN_LED_GREEN, LOW);
      lastBeat = millis();
    }
  }
}

// --- COMMUNICATION ---
void sendLoRaTelemetry() {
  updateGPS();

  if (isEmergency) {
    heartRate = 0;
    spo2 = 0;
  } else {
    heartRate = random(70, 78);
    spo2 = random(97, 99);
  }

  JsonDocument doc;
  doc["node"] = NODE_ID;
  doc["hr"] = heartRate;
  doc["oxy"] = spo2;
  doc["sos"] = isEmergency;
  doc["fall"] = fallDetected;
  doc["worn"] = isWorn;

  if (gps.location.isValid()) {
    doc["lat"] = gps.location.lat();
    doc["lng"] = gps.location.lng();
  } else {
    doc["lat"] = 0.0;
    doc["lng"] = 0.0;
  }

  String jsonString;
  serializeJson(doc, jsonString);

  LoRa.beginPacket();
  LoRa.print(jsonString);
  LoRa.endPacket();

  Serial.print("[TX] ");
  Serial.println(jsonString);
}

void checkButtons() {
  int sosState = digitalRead(PIN_BUTTON_SOS);
  int funcState = digitalRead(PIN_BUTTON_FUNC);

  // BUTTON 1 (SOS): TOGGLE EMERGENCY
  if (sosState == LOW && lastSosState == HIGH) {
    pressTimeSos = millis();
  }
  if (sosState == HIGH && lastSosState == LOW) {
    if (millis() - pressTimeSos > 50) { // Debounce
      isEmergency = !isEmergency;
      isCardiacEvent = false;
      fallDetected = false;
      triggerHaptic(500);
      Serial.println(isEmergency ? "SOS ON" : "SOS OFF");
      sendLoRaTelemetry();
    }
  }

  // BUTTON 2 (FUNC): PAGE / CALL / CANCEL
  if (funcState == LOW && lastFuncState == HIGH) {
    pressTimeFunc = millis();
  }

  // Detect Release (Short vs Long)
  if (funcState == HIGH && lastFuncState == LOW) {
    unsigned long duration = millis() - pressTimeFunc;

    if (duration > 50 && duration < 1000) {
      // SHORT PRESS: Check SOS State first
      if (isEmergency) {
        // Confirm to Cancel? Maybe require long press.
        // For simple interaction, short press does nothing or maybe flips page.
        // Let's allow page flip even in emergency but keep alarm going.
        currentPage = (currentPage + 1) % 2;
        updateDisplay();
      } else {
        // Cycle Page
        currentPage = (currentPage + 1) % 2;
        triggerBeep(50);
        updateDisplay();
      }
    } else if (duration >= 1000) {
      // LONG PRESS:
      if (isEmergency) {
        // CANCEL EMERGENCY
        isEmergency = false;
        fallDetected = false;
        triggerBeep(100);
        triggerBeep(100);
        sendLoRaTelemetry();
      } else {
        // SEND CALL REQUEST
        Serial.println("CALL REQUEST");
        triggerHaptic(200);
        triggerHaptic(200);

        JsonDocument doc;
        doc["node"] = NODE_ID;
        doc["sos"] = false;
        doc["call"] = true;
        doc["worn"] = isWorn;

        String jsonString;
        serializeJson(doc, jsonString);
        LoRa.beginPacket();
        LoRa.print(jsonString);
        LoRa.endPacket();

        // Visual Feedback
        display.clearDisplay();
        display.setCursor(10, 30);
        display.println("CALL SENT!");
        display.display();
        delay(1500);
      }
    }
  }

  lastSosState = sosState;
  lastFuncState = funcState;
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  pinMode(PIN_BUTTON_SOS, INPUT_PULLUP);
  pinMode(PIN_BUTTON_FUNC, INPUT_PULLUP);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_VIB_MOTOR, OUTPUT);

  // MPU6050
  if (!mpu.begin())
    Serial.println("MPU6050 Failed");
  else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  if (!pox.begin())
    Serial.println("MAX30100 Failed");
  else
    pox.setIRLedCurrent(MAX30100_LED_CURR_7_6MA);

  // OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    Serial.println(F("SSD1306 failed"));
  display.display();
  delay(2000);
  display.clearDisplay();

  WiFi.mode(WIFI_STA);
  if (esp_now_init() == ESP_OK) {
    memcpy(peerInfo.peer_addr, broadcastAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    esp_now_add_peer(&peerInfo);
  }

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(BAND)) {
    digitalWrite(PIN_LED_RED, HIGH);
    while (1)
      ;
  }
}

void loop() {
  checkButtons();
  updateGPS();
  checkFall();
  updateIndicators();
  pox.update();

  // WEAR DETECTION
  bool currentWornState = (pox.getIR() > 7000);
  if (currentWornState != isWorn) {
    isWorn = currentWornState;
    sendLoRaTelemetry();
    if (isWorn)
      triggerBeep(100);
  }

  if (millis() - lastSendTime > SEND_INTERVAL) {
    if (isWorn)
      sendLoRaTelemetry();
    lastSendTime = millis();
  }

  // CHECK FOR INCOMING MESSAGES (REMINDERS)
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String packet = "";
    while (LoRa.available())
      packet += (char)LoRa.read();

    if (packet.indexOf(NODE_ID) >= 0 && packet.indexOf("REMINDER") >= 0) {
      display.clearDisplay();
      display.setTextSize(2);
      display.setCursor(0, 20);
      display.println("TAKE MEDS!");
      display.display();
      for (int i = 0; i < 3; i++) {
        triggerHaptic(500);
        triggerBeep(500);
        delay(200);
      }
      delay(2000);
    }
  }

  // Update Display periodically
  if (millis() - lastDisplayUpdate > 500) {
    updateDisplay();
    lastDisplayUpdate = millis();
  }
}
