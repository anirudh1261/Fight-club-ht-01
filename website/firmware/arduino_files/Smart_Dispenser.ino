#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <RtcDS3231.h>
#include <Servo.h>
#include <Wire.h>
#include <espnow.h>

// --- HARDWARE CONFIGURATION (ESP8266 NodeMCU) ---
// Servos
#define PIN_SERVO_1 0  // D3 (GPIO0)
#define PIN_SERVO_2 2  // D4 (GPIO2)
#define PIN_SERVO_3 14 // D5 (GPIO14)

// RTC (I2C)
#define PIN_SDA 4 // D2 (GPIO4)
#define PIN_SCL 5 // D1 (GPIO5)

// Buzzer
#define PIN_BUZZER 12 // D6 (GPIO12)

// Objects
Servo servo1;
Servo servo2;
Servo servo3;
RtcDS3231<TwoWire> Rtc(Wire);

// Constants
#define NUM_SLOTS 3

// Schedule Storage
struct ScheduleItem {
  int hour;
  int minute;
  bool active;
  bool dispensed;
};

ScheduleItem schedule[NUM_SLOTS] = {
    {9, 0, true, false},  // Slot 1 Default: 9:00 AM
    {13, 0, true, false}, // Slot 2 Default: 1:00 PM
    {20, 0, true, false}  // Slot 3 Default: 8:00 PM
};

// ESP-NOW Structure
typedef struct struct_message {
  char type[10]; // "UPDATE"
  int slot_id;   // 1, 2, or 3
  int hour;
  int minute;
} struct_message;

struct_message myData;

// --- HELPERS ---
void triggerBuzzer(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(200);
    digitalWrite(PIN_BUZZER, LOW);
    delay(100);
  }
}

void rotateServo(int slot) {
  Servo *target;
  switch (slot) {
  case 1:
    target = &servo1;
    break;
  case 2:
    target = &servo2;
    break;
  case 3:
    target = &servo3;
    break;
  default:
    return;
  }

  Serial.printf("Dispensing Slot %d...\n", slot);

  // Alert before Dispense
  triggerBuzzer(3);

  target->write(180); // Open
  delay(1000);        // Hold open
  target->write(0);   // Close
  delay(500);
}

// --- ESP-NOW CALLBACK ---
void OnDataRecv(uint8_t *mac, uint8_t *incomingData, uint8_t len) {
  memcpy(&myData, incomingData, sizeof(myData));

  Serial.printf("Received: Type=%s Slot=%d Time=%02d:%02d\n", myData.type,
                myData.slot_id, myData.hour, myData.minute);

  if (strcmp(myData.type, "UPDATE") == 0) {
    int idx = myData.slot_id - 1;
    if (idx >= 0 && idx < NUM_SLOTS) {
      schedule[idx].hour = myData.hour;
      schedule[idx].minute = myData.minute;
      schedule[idx].active = true;
      schedule[idx].dispensed = false; // Reset for new time
      Serial.println("Schedule Updated!");

      // Visual Confirmation (Quick Wiggle)
      digitalWrite(PIN_BUZZER, HIGH);
      delay(50);
      digitalWrite(PIN_BUZZER, LOW);
      rotateServo(myData.slot_id); // Verification Move
    }
  }
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);

  // Buzzer
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // Servos
  servo1.attach(PIN_SERVO_1);
  servo1.write(0);
  servo2.attach(PIN_SERVO_2);
  servo2.write(0);
  servo3.attach(PIN_SERVO_3);
  servo3.write(0);

  // RTC
  Wire.begin(PIN_SDA, PIN_SCL);
  Rtc.Begin();
  if (!Rtc.GetIsRunning()) {
    Serial.println("RTC was not running, starting now");
    Rtc.SetIsRunning(true);
  }

  // WiFi & ESP-NOW
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != 0) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_set_self_role(ESP_NOW_ROLE_SLAVE);
  esp_now_register_recv_cb(OnDataRecv);

  Serial.println("Smart Dispenser Ready (3 Slots)");
  triggerBuzzer(1); // Boot Beep
}

// --- LOOP ---
void loop() {
  RtcDateTime now = Rtc.GetDateTime();

  // Print time every 5s logic check
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 5000) {
    lastCheck = millis();
    Serial.printf("Time: %02d:%02d:%02d\n", now.Hour(), now.Minute(),
                  now.Second());

    // Reset "Dispensed" flag at Midnight
    if (now.Hour() == 0 && now.Minute() == 0) {
      for (int i = 0; i < NUM_SLOTS; i++)
        schedule[i].dispensed = false;
    }

    // Check Schedule
    for (int i = 0; i < NUM_SLOTS; i++) {
      if (schedule[i].active && !schedule[i].dispensed) {
        if (now.Hour() == schedule[i].hour &&
            now.Minute() == schedule[i].minute) {
          rotateServo(i + 1);
          schedule[i].dispensed = true;
          Serial.printf("Dispensed Slot %d\n", i + 1);
        }
      }
    }
  }
}
