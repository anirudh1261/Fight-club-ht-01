# AyuLink Platform - Project Overview

This document provides a comprehensive overview of the **AyuLink** frontend application, highlighting its architecture, core features, routing structure, and data management.

## 1. Tech Stack
- **Framework:** Next.js 16 (App Router paradigm) with React 19
- **Styling:** Tailwind CSS with Lucide React for iconography 
- **Mapping & Data Viz:** Leaflet (via `react-leaflet`) for geographical mapping and Recharts for data visualization.
- **Database / Backend:** Originally built around Supabase. Currently abstracted behind a mock client that routes standard `supabase.from()` calls to local Next.js API routes (`/api/local-db` and `/api/local-storage`).
- **Language:** TypeScript

## 2. Core Features & Capabilities

Based on the component architecture, the platform serves as a **Rural Elderly Healthcare Management System** with multiple distinct operational roles (ASHA Workers, Paramedics, Family Members, and Doctors).

*   **Real-Time Health Monitoring** 
    * Tracks vitals and computes risk scores (`LiveVitalsMonitor`, `RiskScoreCard`, `RiskTrendCard`).
    * AI-driven insights for predicting health outcomes (`AIHealthInsights`, `AIInsightsPanel`).
*   **Emergency & Logistics**
    * Live maps rendering village locations and emergency events (`LiveMap`, `VillageMap`, `EmergencyMapModal`).
    * Timeline tracking for emergency events (`EmergencyTimeline`).
*   **Medicine & Smart Dispensers**
    * Hardware integration dashboards (`app/dispensers`, `app/devices`).
    * Tracking medicinal adherence (`MedicineCompliance`, `MedicineScheduleManager`).
*   **Patient & Record Management**
    * Comprehensive patient profiles and record uploads with Webcam integration (`AddPatientModal`, `RecordUploadModal`, `WebcamCapture`).
*   **Offline/Remote Hardware Integration**
    * LoRa Mesh networking and Gateway connections (`app/lora-mesh`, `GatewayConnector`), critical for deep-rural areas without internet.
*   **Multi-Role Access**
    * Paramedic QR code handoffs (`ParamedicQRModal`).
    * Custom dashboards for family members (`app/family-dashboard`).
    * ASHA (Accredited Social Health Activist) verification and visit tracking (`ASHAVerification`, `app/asha-visits`).

## 3. Directory Structure

### `app/` (Next.js App Router)
The application is split into highly modular route segments.
- **/analytics, /dashboard, /stats:** Main overview screens.
- **/patients, /records, /vitals, /prescriptions:** Core health metrics & patient data.
- **/emergency, /paramedic, /mobile:** Urgent care handling and field worker interfaces.
- **/lora-mesh, /devices, /dispensers:** IoT hardware monitoring.
- **/api/local-db, /api/local-storage:** Local backend handlers for persisting our mock Supabase data natively to the filesystem.

### `components/` (React Components)
Contains over 30 reusable components governing the UI:
- **Modals:** Nearly every complex action is windowed (`AddPatientModal`, `CommandCenterModal`, `SettingsModal`, `DietaryModal`).
- **Widgets:** Complex self-contained UI blocks (`StatsDashboard`, `VoiceTranslator`, `QuickActions`, `SchemeEligibility`).
- **Maps & Location:** Custom map elements for tracking devices and patients (`LiveMap`, `VillageMap`).

### `data/ & public/uploads/`
- **`data/db.json`:** The local JSON repository replacing Supabase. 
- **`public/uploads/`:** The local folder destination where `WebcamCapture` and document uploads are persisted.

## 4. Current State & Workflow
The application is currently configured for rapid local development and demonstration. The standard cloud dependency (Supabase) has been bypassed using a custom local bridge (`lib/supabaseClient.ts`), which proxies cloud requests directly to the file system. This guarantees that forms can be populated, images taken, and records updated continuously without internet access or valid cloud API keys.
