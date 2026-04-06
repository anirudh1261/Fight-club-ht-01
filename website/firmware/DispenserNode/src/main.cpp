#include <Arduino.h>
#include <LoRa.h>
#include <ArduinoJson.h>
#include <Servo.h>

// ================================
// CONFIGURATION
// ================================
const char* DEVICE_ID = "MB-001"; // Set this unique for each dispenser

// LoRa Pins (NodeMCU / ESP8266)
#define LORA_SCK  14 // D5
#define LORA_MISO 12 // D6
#define LORA_MOSI 13 // D7
#define LORA_SS   15 // D8
#define LORA_RST  16 // D0
#define LORA_DIO0 5  // D1

// Dispenser Slot Pins (Servos)
#define SLOT1_PIN 4  // D2
#define SLOT2_PIN 0  // D3
#define SLOT3_PIN 2  // D4
#define SLOT4_PIN 10 // SD3 (or use D9/D10 if available)

Servo slot1, slot2, slot3, slot4;

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- AyuLink Pill Dispenser Loading ---");
  Serial.print("ID: "); Serial.println(DEVICE_ID);

  // 1. Initialize Servos
  slot1.attach(SLOT1_PIN);
  slot2.attach(SLOT2_PIN);
  slot3.attach(SLOT3_PIN);
  slot4.attach(SLOT4_PIN);

  // Set initial position (Closed)
  slot1.write(0);
  slot2.write(0);
  slot3.write(0);
  slot4.write(0);

  // 2. Setup LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("[LoRa] FAILED!");
    while (1);
  }
  LoRa.setSpreadingFactor(7);
  Serial.println("[LoRa] OK");
}

void dispense(int slotNum) {
  Serial.print("[ACT] Dispensing Slot: "); Serial.println(slotNum);
  
  Servo* target;
  switch (slotNum) {
    case 1: target = &slot1; break;
    case 2: target = &slot2; break;
    case 3: target = &slot3; break;
    case 4: target = &slot4; break;
    default: return;
  }

  // Dispensing sequence: Open -> Wait -> Close
  target->write(90);  // Open
  delay(1000);        // Wait for pill to fall
  target->write(0);   // Close
  
  Serial.println("[OK] Dispensed");
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String packet = "";
    while (LoRa.available()) {
      packet += (char)LoRa.read();
    }

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, packet);

    if (error) {
      Serial.println("[ERR] Malformed Packet");
      return;
    }

    // Check if command is for this device
    String targetDevice = doc["target"].as<String>();
    if (targetDevice == DEVICE_ID) {
      String cmd = doc["cmd"].as<String>();
      if (cmd == "dispense") {
        int slot = doc["slot"];
        dispense(slot);
      }
    }
  }
}
