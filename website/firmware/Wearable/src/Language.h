#ifndef LANGUAGE_H
#define LANGUAGE_H

#include <Arduino.h>

// ==========================================
// 🌐 Multilingual Notification System
// ==========================================
// Supports: English (EN), Hindi (HI), Telugu (TE)
//
// NOTE: For OLED Display, we use simplified ASCII
// For Audio TTS or SD Card playback, use full UTF-8

enum Language { LANG_EN = 0, LANG_HI = 1, LANG_TE = 2 };

// Current language (saved in EEPROM)
extern Language currentLanguage;

// ==========================================
// 📝 Text Strings Structure
// ==========================================
struct NotificationText {
  const char *en; // English
  const char *hi; // Hindi (Romanized for OLED)
  const char *te; // Telugu (Romanized for OLED)
};

// ==========================================
// 🚨 ALERT MESSAGES
// ==========================================

// SOS Messages
const NotificationText MSG_SOS_ACTIVATED = {
    "SOS ACTIVATED!", "SOS DABAYA GAYA!", "SOS NOPPINARU!"};

const NotificationText MSG_SOS_HELP_COMING = {
    "Help is coming", "Madad aa rahi hai", "Sahayam vastundi"};

const NotificationText MSG_SOS_CANCELLED = {"SOS Cancelled", "SOS Radda",
                                            "SOS Raddu"};

// Fall Detection
const NotificationText MSG_FALL_DETECTED = {"FALL DETECTED!", "GIRNE KA PATA!",
                                            "PADIPOVADAMU!"};

const NotificationText MSG_FALL_ARE_YOU_OK = {"Are you OK?", "Aap theek ho?",
                                              "Miru bagunnara?"};

const NotificationText MSG_FALL_PRESS_OK = {
    "Press OK if safe", "Theek ho to OK dabo", "Safe aithe OK noppandi"};

// Vital Alerts
const NotificationText MSG_HIGH_HEART_RATE = {
    "HIGH HEART RATE!", "DHADKAN TEJ HAI!", "HRUDAYA VEGA!"};

const NotificationText MSG_LOW_OXYGEN = {"LOW OXYGEN!", "OXYGEN KAM HAI!",
                                         "OXYGEN TAKKUVA!"};

const NotificationText MSG_HIGH_TEMP = {"HIGH TEMPERATURE!", "BUKHAR HAI!",
                                        "JVARAM UNDI!"};

const NotificationText MSG_VITALS_NORMAL = {"Vitals Normal", "Sehat Theek Hai",
                                            "Arogyam Baga Undi"};

// System Messages
const NotificationText MSG_CONNECTING = {"Connecting...", "Jud raha hai...",
                                         "Kaluputunnamu..."};

const NotificationText MSG_CONNECTED = {"Connected!", "Jud Gaya!",
                                        "Kalusukunnamu!"};

const NotificationText MSG_NO_SIGNAL = {"No Signal", "Signal Nahi",
                                        "Signal Ledu"};

const NotificationText MSG_BATTERY_LOW = {"Battery Low!", "Battery Kam!",
                                          "Battery Takkuva!"};

const NotificationText MSG_CHARGING = {"Charging...", "Charge ho raha...",
                                       "Charge avutundi..."};

// Medication Reminders
const NotificationText MSG_MEDICINE_TIME = {"MEDICINE TIME!", "DAWAI KA SAMAY!",
                                            "MANDULA SAMAYAM!"};

const NotificationText MSG_TAKE_MEDICINE = {
    "Take your medicine", "Apni dawai lo", "Mi mandulu teesukondi"};

// Appointment Reminders
const NotificationText MSG_APPOINTMENT = {"APPOINTMENT TODAY", "AAJ MILNA HAI",
                                          "IVVALA APPOINTMENT"};

const NotificationText MSG_DOCTOR_VISIT = {"Visit PHC today", "Aaj PHC jao",
                                           "Ivvala PHC ki vellandi"};

// Greeting Messages
const NotificationText MSG_GOOD_MORNING = {"Good Morning!", "Suprabhat!",
                                           "Subhodayam!"};

const NotificationText MSG_GOOD_EVENING = {"Good Evening!", "Shubh Sandhya!",
                                           "Subhakaram!"};

// ==========================================
// 🔧 Helper Functions
// ==========================================

// Get text in current language
inline const char *getText(const NotificationText &msg) {
  switch (currentLanguage) {
  case LANG_HI:
    return msg.hi;
  case LANG_TE:
    return msg.te;
  default:
    return msg.en;
  }
}

// Get language name
inline const char *getLanguageName() {
  switch (currentLanguage) {
  case LANG_HI:
    return "Hindi";
  case LANG_TE:
    return "Telugu";
  default:
    return "English";
  }
}

// Cycle to next language
inline void cycleLanguage() {
  currentLanguage = (Language)((currentLanguage + 1) % 3);
}

// ==========================================
// 🔊 Audio Notification Files (SD Card)
// ==========================================
// These correspond to MP3/WAV files on SD card
// Format: /sounds/{lang}/{message_id}.mp3

const char *AUDIO_PATHS[] = {"/sounds/en/", "/sounds/hi/", "/sounds/te/"};

inline String getAudioPath(const char *messageId) {
  return String(AUDIO_PATHS[currentLanguage]) + String(messageId) + ".mp3";
}

// Audio file IDs
#define AUDIO_SOS "sos"
#define AUDIO_FALL "fall"
#define AUDIO_HEART "high_hr"
#define AUDIO_OXYGEN "low_spo2"
#define AUDIO_FEVER "fever"
#define AUDIO_MEDICINE "medicine"
#define AUDIO_APPOINTMENT "appointment"
#define AUDIO_OK "ok"
#define AUDIO_HELP_COMING "help_coming"

#endif
