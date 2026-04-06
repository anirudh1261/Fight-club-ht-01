#include "MAX30100_PulseOximeter.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <LoRa.h>
#include <SPI.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <Wire.h>
#include <esp_now.h>

// --- HARDWARE CONFIGURATION (ESP32 DevKit V1) ---
// Buttons
#define PIN_BUTTON_SOS 33 // EXTERNAL SOS Button (Input Pullup)
#define PIN_BUTTON_OK 32  // Cancel / Check-in Button

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

// Button Logic
bool lastSosState = HIGH;
bool lastOkState = HIGH;
unsigned long comboPressStart = 0;
bool comboActive = false;

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
  } else if (isCardiacEvent) {
    // Alert
    digitalWrite(PIN_LED_YELLOW, HIGH);
    static bool blinkState = false;
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 500) {
      blinkState = !blinkState;
      lastBlink = millis();
      if (blinkState) {
        triggerHaptic(200);
        triggerBeep(100);
      }
    }
    digitalWrite(PIN_LED_RED, blinkState ? HIGH : LOW);
  } else {
    // Safe
    static unsigned long lastBeat = 0;
    if (millis() - lastBeat > 1000) {
      digitalWrite(PIN_LED_GREEN, HIGH);
      delay(100);
      digitalWrite(PIN_LED_GREEN, LOW);
      lastBeat = millis();
    }
  }
}

// --- COMMUNICATION ---
void sendLoRaTelemetry() {
  updateGPS();

  // 1. Simulate Vitals
  if (isEmergency) {
    heartRate = 0;
    spo2 = 0;
  } else if (isCardiacEvent) {
    heartRate = random(130, 155);
    spo2 = random(82, 89);
  } else {
    heartRate = random(70, 78);
    spo2 = random(97, 99);
  }

  // 2. Create JSON Packet
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

  // 3. Send via LoRa
  LoRa.beginPacket();
  LoRa.print(jsonString);
  LoRa.endPacket();

  Serial.print("[TX] ");
  Serial.println(jsonString);
}

void checkButtons() {
  int sosState = digitalRead(PIN_BUTTON_SOS);
  int okState = digitalRead(PIN_BUTTON_OK);

  // 1. COMBO CHECK (Both pressed)
  if (sosState == LOW && okState == LOW) {
    if (!comboActive) {
      comboActive = true;
      comboPressStart = millis();
      Serial.println("[Input] Dual Press Detected");
    } else if (millis() - comboPressStart > 2000) {
      // TRIGGER CARDIAC EVENT
      if (!isCardiacEvent) {
        isCardiacEvent = true;
        isEmergency = false; // Reset SOS if switching modes
        triggerHaptic(1000); // Unique pattern
        triggerBeep(500);
        delay(100);
        triggerBeep(500);
        Serial.println("[Input] CARDIAC EVENT TRIGGERED");
        sendLoRaTelemetry();
      }
    }
    return; // Skip single checks while holding combo
  } else {
    comboActive = false;
  }

  // 2. SOS Only
  if (sosState == LOW && lastSosState == HIGH) {
    delay(50); // Debounce
    if (digitalRead(PIN_BUTTON_SOS) == LOW) {
      // Wait to see if user is going for combo
      delay(200);
      if (digitalRead(PIN_BUTTON_OK) == HIGH) {
        isEmergency = !isEmergency;
        isCardiacEvent = false;
        triggerHaptic(500); // Standard Click
        Serial.println(isEmergency ? "[Input] SOS ACTIVATED"
                                   : "[Input] SOS DEACTIVATED");
        sendLoRaTelemetry();
      }
    }
  }

  // 3. Cancel / Check-in / Call Request
  if (okState == LOW && lastOkState == HIGH) {
    unsigned long pressTime = millis();
    bool longPress = false;

    // Wait to see if it's a long press
    while (digitalRead(PIN_BUTTON_OK) == LOW) {
      if (millis() - pressTime > 3000) {
        longPress = true;
        triggerHaptic(100);
        delay(100);
        triggerHaptic(100); // Ack
        break;
      }
    }

    if (longPress) {
      // CALL REQUEST
      Serial.println("[Input] CALL REQUEST SENT");

      // Send Special Packet
      updateGPS();
      JsonDocument doc;
      doc["node"] = NODE_ID;
      doc["hr"] = heartRate;
      doc["oxy"] = spo2;
      doc["sos"] = false;
      doc["fall"] = false;
      doc["worn"] = isWorn;
      doc["call"] = true; // New Flag
      doc["lat"] = gps.location.isValid() ? gps.location.lat() : 0.0;
      doc["lng"] = gps.location.isValid() ? gps.location.lng() : 0.0;

      String jsonString;
      serializeJson(doc, jsonString);
      LoRa.beginPacket();
      LoRa.print(jsonString);
      LoRa.endPacket();
      Serial.println("[TX] " + jsonString);

      // Wait for release
      while (digitalRead(PIN_BUTTON_OK) == LOW)
        ;
    } else {
      // Short Press Logic (Existing)
      delay(50); // Debounce
      // Check for Combo...
      delay(200);
      if (digitalRead(PIN_BUTTON_SOS) == HIGH) {
        isEmergency = false;
        isCardiacEvent = false;
        fallDetected = false;
        triggerBeep(100);
        triggerBeep(100);
        sendLoRaTelemetry();
      }
    }
  }
  lastSosState = sosState;
  lastOkState = okState;
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);

  // --- I2C DEBUGGING ---
  Wire.begin(21, 22); // Explicitly define SDA=21, SCL=22
  Serial.println("\nI2C Scanner checking...");
  byte error, address;
  int nDevices = 0;
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16)
        Serial.print("0");
      Serial.print(address, HEX);
      Serial.println("  !");
      nDevices++;
    } else if (error == 4) {
      Serial.print("Unknown error at address 0x");
      if (address < 16)
        Serial.print("0");
      Serial.println(address, HEX);
    }
  }
  if (nDevices == 0)
    Serial.println("No I2C devices found\n");
  else
    Serial.println("done\n");
  // ---------------------

  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  pinMode(PIN_BUTTON_SOS, INPUT_PULLUP);
  pinMode(PIN_BUTTON_OK, INPUT_PULLUP);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_VIB_MOTOR, OUTPUT);

  // MPU6050 Init
  if (!mpu.begin()) {
    Serial.println("MPU6050 Failed");
  } else {
    Serial.println("MPU6050 Ready");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  if (!pox.begin())
    Serial.println("MAX30100 Failed");
  else
    pox.setIRLedCurrent(MAX30100_LED_CURR_7_6MA);

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
    Serial.println("LoRa Failed!");
    while (1)
      ;
  }
}

void loop() {
  checkButtons();
  updateGPS();
  checkFall(); // Check MPU6050
  updateIndicators();
  pox.update();

  // WEAR DETECTION: IR Logic
  // Threshold typically 7000-10000 for "on wrist"
  bool currentWornState = (pox.getIR() > 7000);

  if (currentWornState != isWorn) {
    isWorn = currentWornState;

    // INSTANT UPDATE: Send immediately on state change
    // If not worn, status becomes "offline" or "not worn" in payload
    sendLoRaTelemetry();
    Serial.println(isWorn ? "!!! WRIST BAND WORN !!!"
                          : "!!! WRIST BAND REMOVED !!!");

    if (isWorn) {
      triggerBeep(100); // Confirmation beep
    }
  }

  if (millis() - lastSendTime > SEND_INTERVAL) {
    if (isWorn)
      sendLoRaTelemetry();
    lastSendTime = millis();
  }
}
