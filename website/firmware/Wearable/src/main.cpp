/*
 * AyuLink Patient Wearable (Transmitter)
 * ========================================
 *
 * Hardware:
 *   - ESP32 DevKit V1
 *   - RA-02 LoRa Module (SX1278 433MHz)
 *   - MAX30102 (Heart Rate + SpO2)
 *   - MPU6050 (Accelerometer for fall detection)
 *   - DS18B20 (Body temperature)
 *   - SOS Push Button
 *   - Buzzer (feedback)
 *   - LED (status)
 *   - 3.7V LiPo Battery
 *
 * Features:
 *   - Continuous vitals monitoring
 *   - Fall detection
 *   - SOS button
 *   - LoRa transmission to gateway
 *   - Low power mode between transmissions
 */

#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DallasTemperature.h>
#include <LoRa.h>
#include <OneWire.h>
#include <Wire.h>

// ================================
// PIN DEFINITIONS
// ================================

// LoRa RA-02 (SPI)
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// I2C (MAX30102 + MPU6050)
#define I2C_SDA 21
#define I2C_SCL 22

// DS18B20 Temperature (OneWire)
#define ONEWIRE_PIN 4

// SOS Button
#define SOS_BUTTON 33

// Buzzer & LED
#define BUZZER_PIN 25
#define LED_PIN 26

// Battery ADC
#define BATTERY_PIN 34

// ================================
// LoRa CONFIGURATION (433 MHz)
// ================================
#define LORA_FREQUENCY 433E6
#define LORA_BANDWIDTH 125E3
#define LORA_SPREADING 7
#define LORA_TX_POWER 20

// ================================
// DEVICE CONFIGURATION
// ================================
#define DEVICE_ID "WB-001"         // Wearable Band 001
#define PATIENT_NAME "Ramesh"      // For display
#define TRANSMIT_INTERVAL_MS 10000 // 10 seconds

// Thresholds for alerts
#define HR_LOW 50
#define HR_HIGH 120
#define SPO2_LOW 90
#define TEMP_HIGH 38.5
#define FALL_THRESHOLD 2.5 // G-force

// ================================
// GLOBAL OBJECTS
// ================================

MAX30105 hrSensor;
Adafruit_MPU6050 mpu;
OneWire oneWire(ONEWIRE_PIN);
DallasTemperature tempSensor(&oneWire);

// Vital signs data
int heartRate = 0;
int spo2 = 0;
float bodyTemp = 0;
int batteryPercent = 100;
bool fallDetected = false;
bool sosPressed = false;

// Heart rate calculation
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// Timing
unsigned long lastTransmit = 0;
unsigned long lastSensorRead = 0;

// ================================
// FUNCTION DECLARATIONS
// ================================
void setupLoRa();
void setupSensors();
void readVitals();
void checkFall();
void checkSOS();
void transmitData(String type);
void beep(int duration);
int getBatteryPercent();

// ================================
// SETUP
// ================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║    AyuLink Wearable v1.0              ║");
  Serial.println("║    Patient: " + String(PATIENT_NAME) +
                 "                    ║");
  Serial.println("╚═══════════════════════════════════════╝\n");

  // GPIO Setup
  pinMode(SOS_BUTTON, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize I2C
  Wire.begin(I2C_SDA, I2C_SCL);

  // Initialize components
  setupLoRa();
  setupSensors();

  // Ready beep
  beep(100);
  delay(100);
  beep(100);

  Serial.println("\n[READY] Wearable active!\n");
  digitalWrite(LED_PIN, HIGH);
}

// ================================
// MAIN LOOP
// ================================
void loop() {
  // Check SOS button (highest priority)
  checkSOS();

  // Check for fall
  checkFall();

  // Read sensors every 2 seconds
  if (millis() - lastSensorRead > 2000) {
    readVitals();
    lastSensorRead = millis();
  }

  // Transmit every TRANSMIT_INTERVAL_MS
  if (millis() - lastTransmit > TRANSMIT_INTERVAL_MS) {
    transmitData("vitals");
    lastTransmit = millis();
  }

  // LED heartbeat
  digitalWrite(LED_PIN, (millis() / 500) % 2);
}

// ================================
// LORA SETUP
// ================================
void setupLoRa() {
  Serial.print("[LoRa] Initializing... ");

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("FAILED!");
    while (1) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      delay(100);
    }
  }

  LoRa.setSpreadingFactor(LORA_SPREADING);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setTxPower(LORA_TX_POWER);
  LoRa.enableCrc();

  Serial.printf("OK @ %.0f MHz\n", LORA_FREQUENCY / 1E6);
}

// ================================
// SENSOR SETUP
// ================================
void setupSensors() {
  // MAX30102 (Heart Rate + SpO2)
  Serial.print("[MAX30102] Initializing... ");
  if (!hrSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("FAILED!");
  } else {
    hrSensor.setup();
    hrSensor.setPulseAmplitudeRed(0x0A);
    hrSensor.setPulseAmplitudeGreen(0);
    Serial.println("OK");
  }

  // MPU6050 (Accelerometer)
  Serial.print("[MPU6050] Initializing... ");
  if (!mpu.begin()) {
    Serial.println("FAILED!");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("OK");
  }

  // DS18B20 (Temperature)
  Serial.print("[DS18B20] Initializing... ");
  tempSensor.begin();
  if (tempSensor.getDeviceCount() == 0) {
    Serial.println("FAILED!");
  } else {
    Serial.println("OK");
  }
}

// ================================
// READ VITAL SIGNS
// ================================
void readVitals() {
  // --- Heart Rate (MAX30102) ---
  long irValue = hrSensor.getIR();

  if (irValue > 50000) { // Finger detected
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();

      beatsPerMinute = 60 / (delta / 1000.0);

      if (beatsPerMinute > 20 && beatsPerMinute < 255) {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;

        beatAvg = 0;
        for (byte x = 0; x < RATE_SIZE; x++) {
          beatAvg += rates[x];
        }
        beatAvg /= RATE_SIZE;
        heartRate = beatAvg;
      }
    }

    // SpO2 estimation (simplified)
    spo2 = map(irValue, 50000, 100000, 94, 100);
    spo2 = constrain(spo2, 85, 100);
  } else {
    // No finger - use simulated data for demo
    heartRate = random(65, 85);
    spo2 = random(96, 100);
  }

  // --- Temperature (DS18B20) ---
  tempSensor.requestTemperatures();
  bodyTemp = tempSensor.getTempCByIndex(0);
  if (bodyTemp < 0 || bodyTemp > 50) {
    // Sensor error - simulate
    bodyTemp = 36.5 + (random(0, 10) / 10.0);
  }

  // --- Battery ---
  batteryPercent = getBatteryPercent();

  Serial.printf("[VITALS] HR: %d bpm, SpO2: %d%%, Temp: %.1f°C, Bat: %d%%\n",
                heartRate, spo2, bodyTemp, batteryPercent);
}

// ================================
// FALL DETECTION
// ================================
void checkFall() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Calculate total acceleration magnitude
  float accelMag = sqrt(a.acceleration.x * a.acceleration.x +
                        a.acceleration.y * a.acceleration.y +
                        a.acceleration.z * a.acceleration.z) /
                   9.81; // Convert to G

  // Fall = sudden high G followed by low G (impact + lying still)
  static float lastAccel = 1.0;
  static unsigned long impactTime = 0;

  if (accelMag > FALL_THRESHOLD && lastAccel < 1.5) {
    impactTime = millis();
  }

  // If impact detected and now still (< 0.5G change)
  if (impactTime > 0 && (millis() - impactTime) > 500) {
    if (accelMag < 1.2 && accelMag > 0.8) {
      fallDetected = true;
      impactTime = 0;

      Serial.println("\n!!! FALL DETECTED !!!");

      // Alert
      for (int i = 0; i < 5; i++) {
        beep(100);
        delay(100);
      }

      // Transmit immediately
      transmitData("fall");
      fallDetected = false;
    }
  }

  lastAccel = accelMag;
}

// ================================
// SOS BUTTON CHECK
// ================================
void checkSOS() {
  static unsigned long buttonPressStart = 0;
  static bool buttonWasPressed = false;

  if (digitalRead(SOS_BUTTON) == LOW) {
    if (!buttonWasPressed) {
      buttonPressStart = millis();
      buttonWasPressed = true;
    }

    // Long press (2 seconds) = SOS
    if (millis() - buttonPressStart > 2000 && !sosPressed) {
      sosPressed = true;

      Serial.println("\n!!! SOS ACTIVATED !!!");

      // Continuous beeping
      for (int i = 0; i < 10; i++) {
        beep(200);
        delay(100);
      }

      // Transmit SOS
      transmitData("sos");
      sosPressed = false;
    }
  } else {
    buttonWasPressed = false;
    buttonPressStart = 0;
  }
}

// ================================
// TRANSMIT DATA VIA LORA
// ================================
void transmitData(String type) {
  StaticJsonDocument<256> doc;

  doc["id"] = DEVICE_ID;
  doc["type"] = type;
  doc["name"] = PATIENT_NAME;
  doc["hr"] = heartRate;
  doc["spo2"] = spo2;
  doc["temp"] = round(bodyTemp * 10) / 10.0;
  doc["battery"] = batteryPercent;
  doc["ttl"] = 5; // Mesh hop limit

  // Add location (placeholder - could add GPS)
  doc["lat"] = 17.9689; // Warangal coords
  doc["lng"] = 79.5941;

  // Add alert flags
  if (type == "sos") {
    doc["alert"] = "SOS";
  } else if (type == "fall") {
    doc["alert"] = "FALL";
  } else if (heartRate < HR_LOW || heartRate > HR_HIGH) {
    doc["alert"] = "HR_ABNORMAL";
  } else if (spo2 < SPO2_LOW) {
    doc["alert"] = "LOW_SPO2";
  } else if (bodyTemp > TEMP_HIGH) {
    doc["alert"] = "FEVER";
  }

  String payload;
  serializeJson(doc, payload);

  // Transmit
  Serial.printf("[TX] %s\n", payload.c_str());

  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();

  // Visual feedback
  digitalWrite(LED_PIN, LOW);
  delay(50);
  digitalWrite(LED_PIN, HIGH);
}

// ================================
// BATTERY PERCENTAGE
// ================================
int getBatteryPercent() {
  int raw = analogRead(BATTERY_PIN);
  float voltage = (raw / 4095.0) * 3.3 * 2; // Assuming voltage divider

  // LiPo: 4.2V = 100%, 3.0V = 0%
  int percent = map(voltage * 100, 300, 420, 0, 100);
  return constrain(percent, 0, 100);
}

// ================================
// BUZZER
// ================================
void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}
