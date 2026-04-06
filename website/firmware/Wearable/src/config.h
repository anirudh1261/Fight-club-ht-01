#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ==========================================
// 🛰️ LoRa Configuration (SX1278/SX1276)
// ==========================================
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 26
#define LORA_BAND 866E6 // 866MHz for India, 915E6 for US, 433E6 for Asia

// ==========================================
// 📺 OLED Display (SSD1306)
// ==========================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1 // Share with ESP32 Reset if needed, or -1
#define I2C_SDA 21
#define I2C_SCL 22

// ==========================================
// 🔊 Audio (MAX98357A I2S AMP + INMP441 MIC)
// ==========================================
// Speaker (Output)
#define I2S_DOUT 25
#define I2S_BCLK 27
#define I2S_LRC 13

// Microphone (Input) - Optional, sharing bus or separate?
// Usually INMP441 can share BCLK/LRC (WS) but needs distinct Data IN
#define I2S_DIN 33

// ==========================================
// ❤️ Sensors (I2C)
// ==========================================
// MPU6050, MAX30102, MLX90614 live on standard SDA(21)/SCL(22)
#define DHT_PIN 4
#define DHT_TYPE DHT22

// ==========================================
// 🔘 UI Buttons
// ==========================================
#define BTN_SOS 32 // RED BUTTON
#define BTN_OK                                                                 \
  33 // GREEN BUTTON (Note: Check conflict with Mic DIN if using both)
#define BTN_NEXT 35 // YELLOW BUTTON

// Note: If BTN_OK conflicts with I2S_DIN (33), move BTN_OK to 34 (Input only)
#undef BTN_OK
#define BTN_OK 34

// ==========================================
// ⚙️ System settings
// ==========================================
#define DEVICE_ID "WEAR_001"
#define RETRY_DELAY 2000

#endif
