# AyuLink Wearable - Wiring Guide

## Hardware Components

| Component | Purpose |
|-----------|---------|
| ESP32 DevKit | Main controller |
| RA-02 LoRa | 433MHz transmission |
| MAX30102 | Heart rate + SpO2 |
| MPU6050 | Fall detection |
| DS18B20 | Body temperature |
| Push Button | SOS |
| Buzzer | Audio feedback |
| LED | Status indicator |
| 3.7V LiPo | Power |

---

## Wiring Diagram

```
                    ESP32 DevKit V1
    ┌───────────────────────────────────────────┐
    │                                           │
    │  3V3 ●────┬─────────────────────────● VIN │
    │           │                               │
    │  GND ●────┼── COMMON GROUND ────────● GND │
    │           │                               │
    │  D21 ●────┼──► I2C SDA (MAX30102 + MPU)   │
    │           │                               │
    │  D22 ●────┼──► I2C SCL (MAX30102 + MPU)   │
    │           │                               │
    │   D4 ●────┼──► DS18B20 DATA               │
    │           │                               │
    │   D5 ●────┼──► LoRa NSS                   │
    │           │                               │
    │  D18 ●────┼──► LoRa SCK                   │
    │           │                               │
    │  D19 ●────┼──► LoRa MISO                  │
    │           │                               │
    │  D23 ●────┼──► LoRa MOSI                  │
    │           │                               │
    │  D14 ●────┼──► LoRa RST                   │
    │           │                               │
    │   D2 ●────┼──► LoRa DIO0                  │
    │           │                               │
    │  D33 ●────┼──► SOS Button (other to GND)  │
    │           │                               │
    │  D25 ●────┼──► Buzzer (+)                 │
    │           │                               │
    │  D26 ●────┼──► LED (+) via 220Ω           │
    │           │                               │
    │  D34 ●────┼──► Battery voltage divider    │
    │           │                               │
    └───────────┴───────────────────────────────┘
```

---

## Detailed Connections

### LoRa RA-02
```
RA-02     ESP32
─────     ─────
VCC   →   3.3V
GND   →   GND
NSS   →   GPIO5
SCK   →   GPIO18
MISO  →   GPIO19
MOSI  →   GPIO23
RST   →   GPIO14
DIO0  →   GPIO2
```

### MAX30102 (I2C)
```
MAX30102  ESP32
────────  ─────
VCC   →   3.3V
GND   →   GND
SDA   →   GPIO21
SCL   →   GPIO22
```

### MPU6050 (I2C - same bus)
```
MPU6050   ESP32
───────   ─────
VCC   →   3.3V
GND   →   GND
SDA   →   GPIO21 (shared)
SCL   →   GPIO22 (shared)
```

### DS18B20 Temperature
```
DS18B20   ESP32
───────   ─────
VCC   →   3.3V
GND   →   GND
DATA  →   GPIO4 (with 4.7kΩ pull-up to 3.3V)
```

### SOS Button
```
Button    ESP32
──────    ─────
Pin 1 →   GPIO33
Pin 2 →   GND
```

---

## Build This AFTER Gateway is Working!

1. First test Gateway alone
2. Then build wearable
3. Test LoRa link between them
