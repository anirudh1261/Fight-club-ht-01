#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include "config.h"
#include <Arduino.h>
#include <Wire.h>

// ==========================================
// 🏭 The "Plug & Play" Interface
// ==========================================
// Abstract Base Class that all sensors must utilize.
// This allows the main code to treat all sensors identically.
class SensorDriver {
public:
  virtual bool begin() = 0;           // Initialize hardware
  virtual void update() = 0;          // Read data
  virtual String getJsonVector() = 0; // Return { "type": "HR", "val": 80 }
  virtual String getName() = 0;       // "MAX30102"
  bool active = false;
};

// ==========================================
// 🧠 The Manager (Hub Logic)
// ==========================================
class SensorManager {
private:
  SensorDriver *drivers[5]; // Support up to 5 concurrent sensors
  int driverCount = 0;

public:
  SensorManager();
  void begin();
  void scanI2C(); // Auto-detects connected devices
  void updateAll();
  String getCombinedPacket(); // Returns full JSON payload

  // Safety & AI Checks
  bool checkFallDetected();
  bool checkVitalAlert();
};

#endif
