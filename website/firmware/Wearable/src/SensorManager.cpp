#include "SensorManager.h"

SensorManager::SensorManager() { driverCount = 0; }

void SensorManager::begin() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA, I2C_SCL);
  Serial.println(">>> Sensor Hub Init...");

  // 🔍 Auto-Scan for I2C Devices
  scanI2C();
}

void SensorManager::scanI2C() {
  byte error, address;
  int nDevices = 0;
  Serial.println("Scanning I2C Bus...");

  // We scan standard addresses to see what is plugged in
  // This supports the "Modular" pitch
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("Found Device at 0x");
      if (address < 16)
        Serial.print("0");
      Serial.println(address, HEX);

      // TODO: Factory Logic to instantiate specific drivers
      // if (address == 0x57) drivers[i] = new MAX30102();
      // if (address == 0x68) drivers[i] = new MPU6050();

      nDevices++;
    }
  }
}

void SensorManager::updateAll() {
  for (int i = 0; i < driverCount; i++) {
    if (drivers[i]->active)
      drivers[i]->update();
  }
}

String SensorManager::getCombinedPacket() {
  // Builds the JSON payload for LoRa
  // Example: { "id": "P-102", "hr": 72, "fall": false, "sos": false }
  String json = "{";
  json += "\"dev\": \"" + String(DEVICE_ID) + "\",";

  // Add sensor data here
  // ...

  json += "\"ts\": " + String(millis());
  json += "}";
  return json;
}

bool SensorManager::checkFallDetected() {
  // Loop through drivers, check if MPU6050 flagged an event
  return false; // Stub
}
