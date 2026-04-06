#include "NotificationManager.h"

NotificationManager::NotificationManager() {
  display = nullptr;
  audioEnabled = true;
  lastNotificationTime = 0;
  notificationDuration = 3000; // 3 seconds default
}

void NotificationManager::begin(Adafruit_SSD1306 *oled) {
  display = oled;
  Serial.println(">>> Notification Manager initialized");
}

void NotificationManager::showAlert(const NotificationText &title,
                                    const NotificationText &message,
                                    uint8_t icon) {
  if (!display)
    return;

  display->clearDisplay();

  // Draw border for alert
  display->drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
  display->drawRect(1, 1, SCREEN_WIDTH - 2, SCREEN_HEIGHT - 2, SSD1306_WHITE);

  // Draw icon if specified
  if (icon != ICON_NONE) {
    drawIcon(icon, (SCREEN_WIDTH - 16) / 2, 8);
  }

  // Title (large)
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  centerText(getText(title), icon ? 26 : 16, 2);

  // Message (small)
  display->setTextSize(1);
  centerText(getText(message), 48);

  display->display();
  lastNotificationTime = millis();
}

void NotificationManager::showStatus(const NotificationText &message) {
  if (!display)
    return;

  display->clearDisplay();
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  centerText(getText(message), 28);
  display->display();
}

void NotificationManager::showVitals(int heartRate, int spo2, float temp) {
  if (!display)
    return;

  display->clearDisplay();

  // Header
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  display->setCursor(0, 0);
  display->print("[ ");
  display->print(getLanguageName());
  display->print(" ]");

  // Draw separator line
  display->drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);

  // Heart Rate
  display->setTextSize(1);
  display->setCursor(0, 16);
  display->print("HR:");
  display->setTextSize(2);
  display->setCursor(24, 14);

  // Highlight if abnormal
  if (heartRate > 100 || heartRate < 50) {
    display->fillRect(22, 12, 40, 18, SSD1306_WHITE);
    display->setTextColor(SSD1306_BLACK);
  }
  display->print(heartRate);
  display->setTextColor(SSD1306_WHITE);
  display->setTextSize(1);
  display->print(" bpm");

  // SpO2
  display->setTextSize(1);
  display->setCursor(0, 34);
  display->print("O2:");
  display->setTextSize(2);
  display->setCursor(24, 32);

  if (spo2 < 92) {
    display->fillRect(22, 30, 40, 18, SSD1306_WHITE);
    display->setTextColor(SSD1306_BLACK);
  }
  display->print(spo2);
  display->setTextColor(SSD1306_WHITE);
  display->setTextSize(1);
  display->print("%");

  // Temperature
  display->setTextSize(1);
  display->setCursor(0, 52);
  display->print("Temp:");
  display->setTextSize(1);
  display->setCursor(36, 52);

  if (temp > 37.5) {
    display->print("!");
  }
  display->print(temp, 1);
  display->print(" C");

  // Status indicator
  display->fillCircle(SCREEN_WIDTH - 6, 4, 3, SSD1306_WHITE);

  display->display();
}

void NotificationManager::showLanguageMenu() {
  if (!display)
    return;

  display->clearDisplay();

  // Title
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  display->setCursor(20, 0);
  display->print("SELECT LANGUAGE");

  display->drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);

  // Language options
  const char *langs[] = {"1. English", "2. Hindi", "3. Telugu"};
  for (int i = 0; i < 3; i++) {
    display->setCursor(10, 18 + (i * 14));
    if ((Language)i == currentLanguage) {
      display->print("> ");
      display->setTextColor(SSD1306_BLACK);
      display->fillRect(8, 16 + (i * 14), 110, 12, SSD1306_WHITE);
      display->setCursor(12, 18 + (i * 14));
    }
    display->print(langs[i]);
    display->setTextColor(SSD1306_WHITE);
  }

  display->display();
}

// ==========================================
// 🚨 Specific Alert Functions
// ==========================================

void NotificationManager::showSOSAlert() {
  showAlert(MSG_SOS_ACTIVATED, MSG_SOS_HELP_COMING, ICON_SOS);
  if (audioEnabled)
    playAudio(AUDIO_SOS);
}

void NotificationManager::showFallAlert() {
  showAlert(MSG_FALL_DETECTED, MSG_FALL_PRESS_OK, ICON_FALL);
  if (audioEnabled)
    playAudio(AUDIO_FALL);
}

void NotificationManager::showHighHeartRateAlert(int hr) {
  showAlert(MSG_HIGH_HEART_RATE, MSG_SOS_HELP_COMING, ICON_HEART);
  if (audioEnabled)
    playAudio(AUDIO_HEART);
}

void NotificationManager::showLowOxygenAlert(int spo2) {
  showAlert(MSG_LOW_OXYGEN, MSG_SOS_HELP_COMING, ICON_OXYGEN);
  if (audioEnabled)
    playAudio(AUDIO_OXYGEN);
}

void NotificationManager::showFeverAlert(float temp) {
  showAlert(MSG_HIGH_TEMP, MSG_SOS_HELP_COMING, ICON_TEMP);
  if (audioEnabled)
    playAudio(AUDIO_FEVER);
}

void NotificationManager::showMedicineReminder(const char *medicine) {
  showAlert(MSG_MEDICINE_TIME, MSG_TAKE_MEDICINE, ICON_MEDICINE);
  if (audioEnabled)
    playAudio(AUDIO_MEDICINE);
}

void NotificationManager::showAppointmentReminder(const char *time,
                                                  const char *doctor) {
  showAlert(MSG_APPOINTMENT, MSG_DOCTOR_VISIT, ICON_CALENDAR);
  if (audioEnabled)
    playAudio(AUDIO_APPOINTMENT);
}

void NotificationManager::showBatteryWarning(int percent) {
  showAlert(MSG_BATTERY_LOW, MSG_CHARGING, ICON_BATTERY);
}

void NotificationManager::showConnectionStatus(bool connected) {
  if (connected) {
    showStatus(MSG_CONNECTED);
  } else {
    showStatus(MSG_NO_SIGNAL);
  }
}

// ==========================================
// 🔊 Audio Functions
// ==========================================

void NotificationManager::playAudio(const char *messageId) {
  String path = getAudioPath(messageId);
  Serial.print("Playing audio: ");
  Serial.println(path);

  // TODO: Implement actual audio playback via I2S
  // audioPlayer.play(path.c_str());
}

void NotificationManager::enableAudio(bool enable) { audioEnabled = enable; }

// ==========================================
// 🌐 Language Functions
// ==========================================

void NotificationManager::setLanguage(Language lang) {
  currentLanguage = lang;
  Serial.print("Language set to: ");
  Serial.println(getLanguageName());
}

Language NotificationManager::getLanguage() { return currentLanguage; }

// ==========================================
// 🛠 Helper Functions
// ==========================================

void NotificationManager::clear() {
  if (display) {
    display->clearDisplay();
    display->display();
  }
}

void NotificationManager::centerText(const char *text, int y, int size) {
  if (!display)
    return;

  display->setTextSize(size);
  int16_t x1, y1;
  uint16_t w, h;
  display->getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  display->setCursor((SCREEN_WIDTH - w) / 2, y);
  display->print(text);
}

void NotificationManager::drawIcon(uint8_t icon, int x, int y) {
  if (!display)
    return;

  // Simple 16x16 icons using basic shapes
  switch (icon) {
  case ICON_SOS:
    // Triangle warning
    display->drawTriangle(x + 8, y, x, y + 14, x + 16, y + 14, SSD1306_WHITE);
    display->drawChar(x + 5, y + 4, '!', SSD1306_WHITE, SSD1306_BLACK, 1);
    break;

  case ICON_HEART:
    // Heart shape
    display->fillCircle(x + 4, y + 5, 4, SSD1306_WHITE);
    display->fillCircle(x + 12, y + 5, 4, SSD1306_WHITE);
    display->fillTriangle(x, y + 7, x + 16, y + 7, x + 8, y + 15,
                          SSD1306_WHITE);
    break;

  case ICON_OXYGEN:
    // O2 symbol
    display->drawCircle(x + 5, y + 8, 5, SSD1306_WHITE);
    display->setTextSize(1);
    display->setCursor(x + 10, y + 8);
    display->print("2");
    break;

  case ICON_TEMP:
    // Thermometer
    display->drawRoundRect(x + 6, y, 5, 12, 2, SSD1306_WHITE);
    display->fillCircle(x + 8, y + 12, 3, SSD1306_WHITE);
    break;

  case ICON_MEDICINE:
    // Pill shape
    display->fillRoundRect(x + 2, y + 4, 12, 8, 4, SSD1306_WHITE);
    display->drawLine(x + 8, y + 4, x + 8, y + 12, SSD1306_BLACK);
    break;

  case ICON_CALENDAR:
    // Calendar
    display->drawRect(x + 1, y + 2, 14, 12, SSD1306_WHITE);
    display->drawLine(x + 1, y + 6, x + 15, y + 6, SSD1306_WHITE);
    display->fillRect(x + 4, y, 2, 4, SSD1306_WHITE);
    display->fillRect(x + 10, y, 2, 4, SSD1306_WHITE);
    break;

  case ICON_BATTERY:
    // Battery
    display->drawRect(x + 1, y + 3, 12, 8, SSD1306_WHITE);
    display->fillRect(x + 13, y + 5, 2, 4, SSD1306_WHITE);
    display->fillRect(x + 3, y + 5, 4, 4, SSD1306_WHITE); // Low level
    break;

  case ICON_WIFI:
    // WiFi arcs
    display->drawCircle(x + 8, y + 12, 2, SSD1306_WHITE);
    for (int r = 5; r <= 11; r += 3) {
      display->drawCircle(x + 8, y + 12, r, SSD1306_WHITE);
    }
    break;

  case ICON_OK:
    // Checkmark
    display->drawLine(x + 2, y + 8, x + 6, y + 12, SSD1306_WHITE);
    display->drawLine(x + 6, y + 12, x + 14, y + 4, SSD1306_WHITE);
    break;

  case ICON_FALL:
    // Person falling
    display->drawCircle(x + 8, y + 3, 3, SSD1306_WHITE);
    display->drawLine(x + 8, y + 6, x + 8, y + 10, SSD1306_WHITE);
    display->drawLine(x + 8, y + 10, x + 4, y + 14, SSD1306_WHITE);
    display->drawLine(x + 8, y + 10, x + 12, y + 14, SSD1306_WHITE);
    display->drawLine(x + 4, y + 7, x + 12, y + 8, SSD1306_WHITE);
    break;
  }
}
