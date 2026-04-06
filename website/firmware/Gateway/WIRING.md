# AyuLink Gateway - Complete Wiring Guide
*Version 3.0 - LoRa & OLED (SIM800L Purged)*

## 📦 Hardware List

| Component | Model | Qty |
|-----------|-------|-----|
| ESP32 | DevKit V1 | 1 |
| LoRa Module | RA-02 (SX1278 433MHz) | 1 |
| Antenna | 433MHz External | 1 |
| OLED Display | SSD1306 128x64 I2C | 1 |
| RTC | DS3231 | 1 |
| SD Card | Module with SD slot | 1 |
| Temp/Humidity | DHT22 | 1 |
| Buzzer | Active 5V | 1 |
| LEDs | Green + Red (5mm) | 2 |
| Resistors | 220Ω (for LEDs) | 2 |
| Power | 5V 2A USB (or Adapter) | 1 |

---

## 🔌 Complete Wiring Diagram

```
    ┌────────────────────────────────────────────────────────────────────────────┐
    │                                                                            │
    │                              ESP32 DevKit V1                               │
    │                                                                            │
    │   ┌──────────────────────────────────────────────────────────────────┐    │
    │   │                                                                  │    │
    │   │  3V3 ●───────┬───────────────────────────────────────────● VIN (5V In) │
    │   │              │                                                   │    │
    │   │  GND ●───────┼──────────── COMMON GROUND ────────────────● GND   │    │
    │   │              │                                                   │    │
    │   │  D15 ●───────┼──► DHT22 DATA                                     │    │
    │   │              │                                                   │    │
    │   │   D2 ●───────┼──► LoRa DIO0                              ● D14 ──┼──► LoRa RST
    │   │              │                                                   │    │
    │   │   D4 ●───────┼──► SD Card CS                                     │    │
    │   │              │                                                   │    │
    │   │   D5 ●───────┼──► LoRa NSS (CS)                                  │    │
    │   │              │                                                   │    │
    │   │  D18 ●───────┼──► LoRa SCK + SD SCK (shared)                     │    │
    │   │              │                                                   │    │
    │   │  D19 ●───────┼──► LoRa MISO + SD MISO (shared)                   │    │
    │   │              │                                                   │    │
    │   │  D21 ●───────┼──► I2C SDA (OLED + RTC)                           │    │
    │   │              │                                                   │    │
    │   │  D22 ●───────┼──► I2C SCL (OLED + RTC)                           │    │
    │   │              │                                                   │    │
    │   │  D23 ●───────┼──► LoRa MOSI + SD MOSI (shared)                   │    │
    │   │              │                                                   │    │
    │   │  D25 ●───────┼──► Buzzer (+)                                     │    │
    │   │              │                                                   │    │
    │   │  D26 ●───────┼──► Green LED (+) via 220Ω                         │    │
    │   │              │                                                   │    │
    │   │  D27 ●───────┼──► Red LED (+) via 220Ω                           │    │
    │   │              │                                                   │    │
    │   └──────────────┴───────────────────────────────────────────────────┘    │
    │                                                                            │
    └────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed Pin Connections

### LoRa RA-02 Module
- **VCC**: 3.3V
- **GND**: GND
- **NSS**: GPIO5
- **SCK**: GPIO18
- **MISO**: GPIO19
- **MOSI**: GPIO23
- **RST**: GPIO14
- **DIO0**: GPIO2

### OLED & RTC (I2C)
- **VCC**: 3.3V
- **GND**: GND
- **SDA**: GPIO21
- **SCL**: GPIO22

### SD Card Module (SPI Shared)
- **VCC**: 5V
- **CS**: GPIO4
- **SCK/MISO/MOSI**: Shared with LoRa

### DHT22
- **DATA**: GPIO15

---

## ⚠️ Important Warnings

1. **LoRa 3.3V Only**: Never connect RA-02 to 5V!
2. **Antenna First**: Always attach antenna before powering LoRa!
3. **Sim Mode**: Now handled by Software Simulation (integrated in Firmware). No physical SIM800L required.

---

## ✅ Expected Serial Output
```
[OLED] Initialized
[LoRa] OK @ 433 MHz
[SD] Initialized
[SIM MODE] Integrated Software SIM Active
[AyuLink] Gateway Listening...
```
