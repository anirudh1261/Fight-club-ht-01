#ifndef NOTIFICATION_MANAGER_H
#define NOTIFICATION_MANAGER_H

#include "Language.h"
#include "config.h"
#include <Adafruit_SSD1306.h>
#include <Arduino.h>
#include <Wire.h>

// ==========================================
// 📺 Notification Manager for OLED + Audio
// ==========================================
// Handles multilingual alerts on display and speaker

class NotificationManager {
private:
  Adafruit_SSD1306 *display;
  bool audioEnabled;
  unsigned long lastNotificationTime;
  unsigned long notificationDuration;

public:
  NotificationManager();
  void begin(Adafruit_SSD1306 *oled);

  // Display notifications
  void showAlert(const NotificationText &title, const NotificationText &message,
                 uint8_t icon = 0);
  void showStatus(const NotificationText &message);
  void showVitals(int heartRate, int spo2, float temp);
  void showLanguageMenu();

  // Alert types with icons
  void showSOSAlert();
  void showFallAlert();
  void showHighHeartRateAlert(int hr);
  void showLowOxygenAlert(int spo2);
  void showFeverAlert(float temp);
  void showMedicineReminder(const char *medicine);
  void showAppointmentReminder(const char *time, const char *doctor);
  void showBatteryWarning(int percent);
  void showConnectionStatus(bool connected);

  // Audio notifications
  void playAudio(const char *messageId);
  void enableAudio(bool enable);

  // Language selection
  void setLanguage(Language lang);
  Language getLanguage();

  // Clear display
  void clear();

private:
  void drawIcon(uint8_t icon, int x, int y);
  void centerText(const char *text, int y, int size = 1);
};

// ==========================================
// 🎨 Icon Types
// ==========================================
#define ICON_NONE 0
#define ICON_SOS 1      // ⚠
#define ICON_HEART 2    // ❤
#define ICON_OXYGEN 3   // 💨
#define ICON_TEMP 4     // 🌡
#define ICON_MEDICINE 5 // 💊
#define ICON_CALENDAR 6 // 📅
#define ICON_BATTERY 7  // 🔋
#define ICON_WIFI 8     // 📶
#define ICON_OK 9       // ✓
#define ICON_FALL 10    // ⬇

#endif
