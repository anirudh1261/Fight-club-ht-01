'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type Language = 'en' | 'hi' | 'te'

interface ThemeContextType {
    theme: Theme
    language: Language
    setTheme: (theme: Theme) => void
    setLanguage: (language: Language) => void
    gatewayIP: string
    setGatewayIP: (ip: string) => void
    t: (key: string) => string
}

// Comprehensive translations for all dashboard text
const translations: Record<Language, Record<string, string>> = {
    en: {
        // Navigation
        dashboard: 'Dashboard',
        patients: 'Patients',
        vitals: 'Vitals Monitor',
        devices: 'Devices',
        notifications: 'Notifications',
        appointments: 'Appointments',
        records: 'Medical Records',
        prescriptions: 'Prescriptions',
        reports: 'Health Intelligence',

        // Dashboard Headers
        primaryHealthCenter: 'Primary Health Center',
        commandCenter: 'Command Center',
        recordVitals: 'Record Vitals',
        systemOnline: 'System Online',
        allSensorsActive: 'All sensors active',

        // Stats
        totalPatients: 'Total Patients',
        activeDevices: 'Active Devices',
        criticalAlerts: 'Critical Alerts',
        healthScore: 'Avg Health Score',
        vsLastWeek: 'vs last week',

        // Alerts
        realTimeEmergency: 'Real-time emergency notifications',
        respondAll: 'Respond All',
        respond: 'Respond',
        sosButtonPressed: 'SOS Button Pressed',
        highBloodPressure: 'High Blood Pressure',
        fallDetected: 'Fall Detected - Movement Irregular',
        minsAgo: 'mins ago',
        hourAgo: 'hour ago',

        // Schedule
        todaySchedule: "Today's Schedule",
        appointments_count: 'appointments',
        healthCheckup: 'Health Check-up',
        vitalReview: 'Vital Review',
        diabetesFollowup: 'Diabetes Follow-up',
        bpMonitoring: 'BP Monitoring',
        next: 'Next',

        // Live Vitals
        liveVitalsMonitor: 'Live Vitals Monitor',
        realtimeData: 'Real-time wearable data',
        streaming: 'streaming',
        heartRate: 'Heart Rate',
        oxygen: 'SpO2',
        temperature: 'Temp',
        bloodPressure: 'BP',
        normal: 'Normal',
        critical: 'Critical',

        // Quick Actions
        quickActions: 'Quick Actions',
        emergency: 'Emergency',
        callAmbulance: 'Ambulance',
        callPHC: 'Call PHC',
        teleconsult: 'Teleconsult',
        medicines: 'Medicines',
        videoCall: 'Video Call',
        swasthGram: 'AyuLink',
        ayuLink: 'AyuLink',
        sendAlert: 'Send Alert',

        // Village Map
        villageCoverage: 'Village Coverage',
        realtimeNetwork: 'Real-time health network status',
        villages: 'Villages',
        online: 'Online',
        alerts: 'Alerts',

        // AI Insights
        aiHealthInsights: 'AI Health Insights',
        mlPowered: 'Machine learning powered predictions',
        aiActive: 'AI Active',
        aiPrediction: 'AI Prediction',
        positiveTrend: 'Positive Trend',
        riskAlert: 'Risk Alert',
        smartSuggestion: 'Smart Suggestion',
        confidence: 'confidence',

        // Sidebar Sections
        monitoring: 'Monitoring',
        careManagement: 'Care Management',
        infrastructure: 'Infrastructure',
        quickAccess: 'Quick Access',
        familyPortal: 'Family Portal',
        settings: 'Settings',
        logout: 'Logout',

        // Settings Modal
        settingsTitle: 'Settings',
        settingsDesc: 'Customize your dashboard',
        appearance: 'Appearance',
        theme: 'Theme',
        themeDesc: 'Choose light or dark mode',
        light: 'Light',
        dark: 'Dark',
        language: 'Language',
        languageDesc: 'Select interface language',
        pushNotifications: 'Push Notifications',
        pushDesc: 'Receive alert notifications',
        soundAlerts: 'Sound Alerts',
        soundDesc: 'Play sound for critical alerts',
        dataPrivacy: 'Data & Privacy',
        autoRefresh: 'Auto Refresh',
        autoRefreshDesc: 'Update vitals every 5 seconds',
        demoCenter: 'Demo Center (Developer)',
        simulationMode: 'Simulation Mode',
        simulationDesc: 'Generate random vitals data',
        startJuryDemo: 'Start Jury Demo',
        manualSOS: 'Manual SOS',
        done: 'Done',

        // Dashboard Extras
        mobileEMS: 'Mobile EMS',
        tabletView: 'Tablet View',
        intelligence: 'Intelligence',
        viewAnalytics: 'View Analytics',
        callRequest: 'CALL REQUEST',
        connecting: 'Connecting...',
        callPatient: 'Call Patient',
        viewProfile: 'View Profile',
        manageSchedules: 'MANAGE SCHEDULES',
        viewAllAppointments: 'View All Appointments',

        // ASHA & Medicine
        ashaVerification: 'ASHA Verification',
        ashaSubtitle: 'Track and verify field worker visits',
        ashaWorkers: 'ASHA WORKERS',
        visitLog: "TODAY'S VISIT LOG",
        routine: 'Routine',
        followup: 'Follow-up',
        visits: 'visits',
        completion: 'completion',
        noVisits: 'No visits logged for today.',
        adherenceStream: 'Adherence Stream',
        liveTelemetry: 'Live Dispenser Telemetry',
        combinedLog: 'Combined LOG',
        scheduled: 'Scheduled',
        stationClean: 'Station Clean • No Alerts',
        observedAt: 'Observed at',
        taken: 'Taken',
        missed: 'Missed',
        link: 'Link',
        sync: 'SYNC',
        today: 'Today',
        week: 'Week',
        streak: 'Streak',

        // Common
        search: 'Search...',
        addPatient: 'Add Patient',
        switchToDark: 'Switch to Dark',
        switchToLight: 'Switch to Light',

        // Analytics
        analyticsDashboard: 'Analytics Dashboard',
        realtimeInsights: 'Real-time insights into rural health operations',
        exportReport: 'Export Report',
        refreshData: 'Refresh Data',
        patientDistribution: 'Patient Distribution by Village',
        systemHealth: 'System Health Status',
        ashaVisitCompletion: 'ASHA Visit Completion (Weekly)',
        heartRateTrend: 'Avg Heart Rate Trend (24h)',
        totalPatientsStats: 'Total Patients',
        criticalAlertsStats: 'Critical Alerts',
        visitsToday: 'Visits Today',
        avgAdherence: 'Avg Adherence',

        // Appointments
        scheduleAppointment: 'Schedule Appointment',
        upcomingAppointments: 'Upcoming Appointments',
        noAppointments: 'No appointments found',
        markComplete: 'Mark Complete',
        cancel: 'Cancel',
        bookAppointment: 'Book Appointment',
        selectPatient: 'Select Patient',
        doctor: 'Doctor',
        location: 'Location',
        status: 'Status',
        confirmed: 'Confirmed',
        pending: 'Pending',
        cancelled: 'Cancelled',

        // Dispensers
        medicineDispensers: 'Medicine Dispensers',
        smartPillBoxes: 'Smart pill boxes',
        registered: 'registered',
        manageDispenserSchedules: 'Manage Schedules',
        devicesOnline: 'Devices Online',
        avgCompliance: 'Avg Compliance',
        lowBattery: 'Low Battery',
        totalDoses: 'Total Doses',
        allDispensers: 'All Dispensers',
        active: 'active',
        needsAttention: 'Needs attention',
        filled: 'Filled',
        dispenserSlots: 'Dispenser Slots',
        signal: 'Signal',
        strong: 'Strong',
        noSignal: 'No signal',
        // Devices Page
        loraMesh: 'LoRa Mesh Network',
        loraDeviceManagement: 'LoRa Device Management',
        deviceManagementSubtitle: 'Pair and manage wearable devices via LoRa network',
        scanForDevices: 'Scan for Devices',
        devicesOffline: 'Devices Offline',
        availableToPair: 'Available to Pair',
        pairedDevices: 'Paired Devices',
        deviceId: 'Device ID',
        patientName: 'Patient Name',
        signalQuality: 'Signal Quality',
        lastSeen: 'Last Seen',
        batteryLevel: 'Battery %',
        pairDevice: 'Pair Device',
        scanningNetwork: 'Scanning LoRa Network...',
        devicePairedSuccess: 'Device Paired Successfully!',

        // Patients Page
        patientsRegistry: 'Registry',
        patientsSubtitle: 'Manage patient records and device assignments',
        contactFamily: 'Contact & Family',
        deviceStatus: 'Device Status',
        conditionsRation: 'Conditions / Ration',
        actions: 'Actions',
        totalPatientsStat: 'Total Patients',
        onlineDevicesWeight: 'Online Devices',
        offlineDevicesWeight: 'Offline Devices',
        criticalPatientsStat: 'Critical Patients',
        allStatus: 'All Status',
        allVillages: 'All Villages',

        // Family Portal
        familyPortalTitle: 'Family Portal',
        patientNotFound: 'Patient not found',
        backToLogin: 'Back to Login',
        age: 'yrs',
        dailySteps: 'Daily Steps',
        todaysMedications: "Today's Medications",
        contactCareTeam: 'Contact Care Team',
        dataEncrypted: 'Data encrypted and protected',
        reportEmergency: 'Report Emergency',
        call: 'Call',
        callNow: 'Call Now',
        callConfirmTitle: 'Call',
        emergencyConfirmTitle: '🚨 This will trigger an emergency alert!',
        emergencyConfirmBody: 'The following will be notified:\n- ASHA Worker\n- PHC Doctor\n- Emergency Services\n\nProceed?',
        emergencySentTitle: '✅ Emergency Alert Sent!',
        emergencySentBody: 'Help is on the way. You will receive a callback within 2 minutes.',
        allVitalsNormal: '✓ All Vitals Normal',
        someVitalsWarning: '⚠ Some Vitals Need Attention',
        criticalContactTeam: '🚨 Critical - Contact Care Team',
        lastUpdated: 'Last updated',
        bpm: 'bpm',
        celsius: 'Celsius',
        mmHg: 'mmHg',
        adherence: 'adherence',
        deviceOnline: 'Device Online',
        offline: 'Offline',
        currentHealthStatus: 'Current Health Status',

        // Landing Page
        heroTitle1: 'HEALTHCARE',
        heroTitle2: 'EVERYWHERE',
        heroTitle3: 'FOR EVERYONE',
        heroSubtitle: 'What if every patient wearing our device becomes a relay node — creating a self-healing mesh network that grows stronger with every user? No WiFi. No SIM card. No smartphone.',
        experienceDemo: 'Experience Live Demo',
        paramedicView: 'Paramedic EMS View',
        problemTitle: "Rural India's Silent Health Emergency",
        problemDesc: 'India has 150 million elderly living in rural areas. 70% have no access to regular health monitoring. When emergencies strike, the average response time is 45 minutes.',
        solutionTitle: 'AyuLink — Connected Care',
        solutionDesc: 'Universal IoT health platform for anyone, anywhere — rural clinics, hospitals, telemedicine, home care. Modular sensors. Self-healing mesh. Works offline.',
        marketTitle: 'A ₹45,000 Crore Gap',
        featuresTitle: '9 Integrated Modules',
        howItWorks: 'How It Works',
        techStack: 'Tech Stack',
        readyLive: 'Ready to See It Live?',
        launchDashboard: 'Launch Dashboard',
    },
    hi: {
        // Navigation
        dashboard: 'डैशबोर्ड',
        patients: 'मरीज',
        vitals: 'विटल्स',
        devices: 'उपकरण',
        notifications: 'सूचनाएं',
        appointments: 'नियुक्तियां',
        records: 'चिकित्सा रिकॉर्ड',
        prescriptions: 'नुस्खे',
        reports: 'रिपोर्ट',
        emergency: 'आपातकालीन',
        primaryHealthCenter: 'प्राथमिक स्वास्थ्य केंद्र',
        commandCenter: 'कमांड सेंटर',
        recordVitals: 'विटल्स रिकॉर्ड करें',
        systemOnline: 'सिस्टम ऑनलाइन',
        allSensorsActive: 'सभी सेंसर सक्रिय',

        // Stats
        totalPatients: 'कुल मरीज',
        activeDevices: 'सक्रिय उपकरण',
        criticalAlerts: 'गंभीर चेतावनी',
        healthScore: 'स्वास्थ्य स्कोर',
        vsLastWeek: 'पिछले हफ्ते बनाम',

        // Quick Actions
        quickActions: 'त्वरित कार्रवाई',
        callAmbulance: 'एंबुलेंस',
        callPHC: 'PHC को कॉल करें',
        teleconsult: 'टेलीकंसल्ट',
        medicines: 'दवाइयाँ',
        videoCall: 'वीडियो कॉल',
        sendAlert: 'अलर्ट भेजें',

        // Schedule
        todaySchedule: 'आज का कार्यक्रम',
        appointments_count: 'नियुक्तियां',
        manageDispenserSchedules: 'डिस्पेंसर शेड्यूल',
        healthCheckup: 'स्वास्थ्य जांच',
        vitalReview: 'विटल्स समीक्षा',
        diabetesFollowup: 'मधुमेह फॉलो-अप',
        bpMonitoring: 'बीपी निगरानी',
        next: 'अगला',

        // Live Vitals
        liveVitalsMonitor: 'लाइव विटल्स मॉनिटर',
        realtimeData: 'रीयल-टाइम डेटा',
        villageCoverage: 'गांव कवरेज',
        realtimeNetwork: 'रीयल-टाइम नेटवर्क',
        villages: 'गाँव',
        online: 'ऑनलाइन',
        alerts: 'अलर्ट',
        viewAllPatients: 'सभी मरीज देखें',

        // AI Insights
        aiHealthInsights: 'AI स्वास्थ्य अंतर्दृष्टि',
        mlPowered: 'मशीन लर्निंग आधारित भविष्यवाणियां',
        aiActive: 'AI सक्रिय',
        aiPrediction: 'AI भविष्यवाणी',
        positiveTrend: 'सकारात्मक रुझान',
        riskAlert: 'जोखिम चेतावनी',
        smartSuggestion: 'स्मार्ट सुझाव',
        confidence: 'आत्मविश्वास',

        // Alerts
        realTimeEmergency: 'रियल-टाइम इमरजेंसी',
        respondAll: 'सभी का जवाब दें',
        sosAlert: 'SOS चेतावनी',
        highHeartRate: 'उच्च हृदय गति',
        lowOxygen: 'कम ऑक्सीजन',
        // ... (existing translations)

        // Devices Page
        loraMesh: 'लोरा मेश नेटवर्क',
        loraDeviceManagement: 'LoRa डिवाइस प्रबंधन',
        deviceManagementSubtitle: 'LoRa नेटवर्क के माध्यम से पहनने योग्य उपकरणों को जोड़ें और प्रबंधित करें',
        scanForDevices: 'उपकरणों के लिए स्कैन करें',
        devicesOffline: 'ऑफ़लाइन उपकरण',
        availableToPair: 'जोड़ने के लिए उपलब्ध',
        pairedDevices: 'जुड़े हुए उपकरण',
        deviceId: 'डिवाइस आईडी',
        patientName: 'मरीज का नाम',
        signalQuality: 'सिग्नल गुणवत्ता',
        lastSeen: 'अंतिम बार देखा',
        batteryLevel: 'बैटरी %',
        pairDevice: 'डिवाइस जोड़ें',
        scanningNetwork: 'LoRa नेटवर्क स्कैन हो रहा है...',
        devicePairedSuccess: 'डिवाइस सफलतापूर्वक जोड़ा गया!',

        // Patients Page
        patientsRegistry: 'रजिस्ट्री',
        patientsSubtitle: 'रोगी रिकॉर्ड और डिवाइस असाइनमेंट प्रबंधित करें',
        contactFamily: 'संपर्क और परिवार',
        deviceStatus: 'डिवाइस स्थिति',
        conditionsRation: 'स्थितियां / राशन',
        actions: 'कार्रवाई',
        totalPatientsStat: 'कुल मरीज',
        onlineDevicesWeight: 'ऑनलाइन उपकरण',
        offlineDevicesWeight: 'ऑफ़लाइन उपकरण',
        criticalPatientsStat: 'गंभीर मरीज',
        allStatus: 'सभी स्थिति',
        allVillages: 'सभी गांव',

        // Sidebar Sections
        monitoring: 'निगरानी',
        careManagement: 'देखभाल प्रबंधन',
        infrastructure: 'बुनियादी ढाँचा',
        quickAccess: 'त्वरित पहुँच',
        familyPortal: 'परिवार पोर्टल',
        settings: 'सेटिंग्स',
        logout: 'लॉग आउट',

        // Settings Modal
        settingsTitle: 'सेटिंग्स',
        settingsDesc: 'अपना डैशबोर्ड अनुकूलित करें',
        appearance: 'दिखावट',
        theme: 'थीम',
        themeDesc: 'लाइट या डार्क मोड चुनें',
        light: 'लाइट',
        dark: 'डार्क',
        language: 'भाषा',
        languageDesc: 'इंटरफ़ेस भाषा चुनें',
        pushNotifications: 'पुश सूचनाएं',
        pushDesc: 'चेतावनी सूचनाएं प्राप्त करें',
        soundAlerts: 'ध्वनि अलर्ट',
        soundDesc: 'गंभीर अलर्ट के लिए ध्वनि बजाएं',
        dataPrivacy: 'डेटा और गोपनीयता',
        autoRefresh: 'स्वतः ताज़ा करें',
        autoRefreshDesc: 'हर 5 सेकंड में विटल्स अपडेट करें',
        demoCenter: 'डेमो सेंटर (डेवलपर)',
        simulationMode: 'सिमुलेशन मोड',
        simulationDesc: 'यादृच्छिक विटल्स डेटा उत्पन्न करें',
        startJuryDemo: 'जूरी डेमो शुरू करें',
        manualSOS: 'मैनुअल SOS',
        done: 'हो गया',

        // Family Portal
        familyPortalTitle: 'परिवार पोर्टल',
        patientNotFound: 'मरीज नहीं मिला',
        backToLogin: 'लॉगिन पर वापस जाएं',
        age: 'वर्ष',
        dailySteps: 'दैनिक कदम',
        todaysMedications: "आज की दवाइयाँ",
        upcomingAppointments: 'आगामी नियुक्तियां',
        contactCareTeam: 'देखभाल टीम से संपर्क करें',
        dataEncrypted: 'डेटा एन्क्रिप्टेड और सुरक्षित',
        reportEmergency: 'आपातकालीन रिपोर्ट करें',
        call: 'कॉल',
        callNow: 'अभी कॉल करें',
        cancel: 'रद्द करें',
        callConfirmTitle: 'कॉल',
        emergencyConfirmTitle: '🚨 यह एक आपातकालीन चेतावनी ट्रिगर करेगा!',
        emergencyConfirmBody: 'निम्नलिखित को सूचित किया जाएगा:\n- आशा कार्यकर्ता\n- पीएचसी डॉक्टर\n- आपातकालीन सेवाएं\n\nआगे बढ़ें?',
        emergencySentTitle: '✅ आपातकालीन चेतावनी भेजी गई!',
        emergencySentBody: 'मदद रास्ते में है। आपको 2 मिनट के भीतर एक कॉलबैक प्राप्त होगा।',
        allVitalsNormal: '✓ सभी विटल्स सामान्य',
        someVitalsWarning: '⚠ कुछ विटल्स पर ध्यान देने की आवश्यकता है',
        criticalContactTeam: '🚨 गंभीर - देखभाल टीम से संपर्क करें',
        lastUpdated: 'अंतिम अपडेट',
        bpm: 'बीपीएम',
        celsius: 'सेल्सियस',
        mmHg: 'एमएमएचजी',
        adherence: 'अनुपालन',
        deviceOnline: 'डिवाइस ऑनलाइन',
        offline: 'ऑफ़लाइन',
        currentHealthStatus: 'वर्तमान स्वास्थ्य स्थिति',

        // Dashboard Extras
        mobileEMS: 'मोबाइल ईएमएस',
        tabletView: 'टैबलेट दृश्य',
        intelligence: 'इंटेलिजेंस',
        viewAnalytics: 'एनालिटिक्स देखें',
        callRequest: 'कॉल अनुरोध',
        connecting: 'कनेक्ट हो रहा है...',
        callPatient: 'मरीज को बुलाओ',
        viewProfile: 'प्रोफ़ाइल देखें',
        manageSchedules: 'अनुसूचियां प्रबंधित करें',
        viewAllAppointments: 'सभी नियुक्तियां देखें',

        // Analytics
        analyticsDashboard: 'एनालिटिक्स डैशबोर्ड',
        realtimeInsights: 'ग्रामीण स्वास्थ्य कार्यों की रीयल-टाइम जानकारी',
        exportReport: 'रिपोर्ट निर्यात करें',
        refreshData: 'डेटा ताज़ा करें',
        patientDistribution: 'गाँव द्वारा रोगी वितरण',
        systemHealth: 'सिस्टम स्वास्थ्य स्थिति',
        ashaVisitCompletion: 'आशा दौरा पूर्णता (साप्ताहिक)',
        heartRateTrend: 'औसत हृदय गति रुझान (24 घंटे)',
        totalPatientsStats: 'कुल मरीज',
        criticalAlertsStats: 'गंभीर अलर्ट',
        visitsToday: 'आज के दौरे',
        avgAdherence: 'औसत अनुपालन',

        // Dispensers
        medicineDispensers: 'दवा डिस्पेंसर',
        smartPillBoxes: 'स्मार्ट पिल बॉक्स',
        registered: 'पंजीकृत',
        // manageDispenserSchedules already exists in Schedule section, checking for duplication... 
        // usage in Schedule section line 315: manageDispenserSchedules: 'डिस्पेंसर शेड्यूल',
        // English value at line 216 is 'Manage Schedules'. 
        // I will use a different key or ensure it matches nicely. 
        // The English key is reused. 
        devicesOnline: 'डिवाइस ऑनलाइन',
        avgCompliance: 'औसत अनुपालन',
        lowBattery: 'कम बैटरी',
        totalDoses: 'कुल खुराक',
        allDispensers: 'सभी डिस्पेंसर',
        active: 'सक्रिय',
        needsAttention: 'ध्यान देने की आवश्यकता है',
        filled: 'भरा हुआ',
        dispenserSlots: 'डिस्पेंसर स्लॉट',
        signal: 'सिग्नल',
        strong: 'मजबूत',
        noSignal: 'कोई सिग्नल नहीं',

        // ASHA & Medicine
        ashaVerification: 'आशा सत्यापन',
        ashaSubtitle: 'फील्ड वर्कर के दौरों को ट्रैक और सत्यापित करें',
        ashaWorkers: 'आशा कार्यकर्ता',
        visitLog: "आज का दौरा लॉग",
        routine: 'नियमित',
        followup: 'फॉलो-अप',
        visits: 'दौरे',
        completion: 'पूर्णता',
        noVisits: 'आज के लिए कोई दौरा लॉग नहीं।',
        adherenceStream: 'अनुपालन स्ट्रीम',
        liveTelemetry: 'लाइव डिस्पेंसर टेलीमेट्री',
        combinedLog: 'संयुक्त लॉग',
        scheduled: 'अनुसूचित',
        stationClean: 'स्टेशन साफ • कोई अलर्ट नहीं',
        observedAt: 'पर देखा गया',
        taken: 'ले लिया',
        missed: 'छूटा हुआ',
        pending: 'लंबित',
        upcoming: 'आगामी',
        link: 'लिंक',
        sync: 'सिंक',
        today: 'आज',
        week: 'सप्ताह',
        streak: 'लगातार',

        // Landing Page (Hindi)
        heroTitle1: 'स्वास्थ्य सेवा',
        heroTitle2: 'हर जगह',
        heroTitle3: 'हर किसी के लिए',
        heroSubtitle: 'क्या होगा यदि हमारा उपकरण पहनने वाला प्रत्येक रोगी एक रिले नोड बन जाए - एक स्व-उपचार जाल नेटवर्क का निर्माण करे जो प्रत्येक उपयोगकर्ता के साथ मजबूत हो जाए? कोई वाईफ़ाई नहीं. कोई सिम कार्ड नहीं. कोई स्मार्टफोन नहीं.',
        experienceDemo: 'लाइव डेमो का अनुभव करें',
        paramedicView: 'पैरामेडिक ईएमएस देखें',
        problemTitle: "ग्रामीण भारत की मूक स्वास्थ्य आपातकाल",
        problemDesc: 'भारत के ग्रामीण इलाकों में 150 मिलियन बुजुर्ग रहते हैं। 70% के पास नियमित स्वास्थ्य निगरानी की कोई सुविधा नहीं है। जब आपात स्थिति आती है, तो औसत प्रतिक्रिया समय 45 मिनट होता है।',
        solutionTitle: 'आयुलिंक — कनेक्टेड केयर',
        solutionDesc: 'किसी के लिए भी, कहीं भी यूनिवर्सल IoT स्वास्थ्य प्लेटफ़ॉर्म — ग्रामीण क्लिनिक, अस्पताल, टेलीमेडिसिन, घरेलू देखभाल। मॉड्यूलर सेंसर. स्वयं-उपचार जाल। ऑफ़लाइन काम करता है.',
        marketTitle: '₹45,000 करोड़ का अंतर',
        featuresTitle: '9 एकीकृत मॉड्यूल',
        howItWorks: 'यह काम किस प्रकार करता है',
        techStack: 'तकनीकी ढेर',
        readyLive: 'इसे लाइव देखने के लिए तैयार हैं?',
        launchDashboard: 'डैशबोर्ड लॉन्च करें',
    },
    te: {
        // Navigation
        dashboard: 'డాష్‌బోర్డ్',
        patients: 'రోగులు',
        vitals: 'వైటల్స్',
        devices: 'పరికరాలు',
        notifications: 'నోటిఫికేషన్లు',
        appointments: 'అపాయింట్‌మెంట్‌లు',
        records: 'రికార్డ్స్',
        prescriptions: 'మందుల చీటీలు',
        reports: 'నివేదికలు',
        emergency: 'అత్యవసర',
        primaryHealthCenter: 'ప్రాథమిక ఆరోగ్య కేంద్రం',
        commandCenter: 'కమాండ్ సెంటర్',
        recordVitals: 'వైటల్స్ రికార్డ్ చేయండి',
        systemOnline: 'సిస్టమ్ ఆన్‌లైన్',
        allSensorsActive: 'అన్ని సెన్సార్ల యాక్టివ్',

        // Stats
        totalPatients: 'మొత్తం రోగులు',
        activeDevices: 'యాక్టివ్ పరికరాలు',
        criticalAlerts: 'క్రిటికల్ అలర్ట్స్',
        healthScore: 'హెల్త్ స్కోర్',
        vsLastWeek: 'గత వారంతో',

        // Quick Actions
        quickActions: 'త్వరిత చర్యలు',
        callAmbulance: 'అంబులెన్స్',
        callPHC: 'PHC కి కాల్ చేయండి',
        teleconsult: 'టెలికన్సల్ట్',
        medicines: 'మందులు',
        videoCall: 'వీడియో కాల్',
        sendAlert: 'అలర్ట్ పంపండి',

        // Schedule
        todaySchedule: 'నేటి షెడ్యూల్',
        appointments_count: 'అపాయింట్‌మెంట్‌లు',
        manageDispenserSchedules: 'డిస్పెన్సర్ షెడ్యూల్',
        healthCheckup: 'ఆరోగ్య పరీక్ష',
        vitalReview: 'వైటల్స్ సమీక్ష',
        diabetesFollowup: 'డయాబెటిస్ ఫాలో-అప్',
        bpMonitoring: 'BP పర్యవేక్షణ',
        next: 'తరువాత',

        // Live Vitals
        liveVitalsMonitor: 'లైవ్ వైటల్స్ మానిటర్',
        realtimeData: 'రియల్ టైమ్ డేటా',
        villageCoverage: 'గ్రామ కవరేజీ',
        realtimeNetwork: 'రియల్ టైమ్ నెట్‌వర్క్',
        villages: 'గ్రామములు',
        online: 'ఆన్‌లైన్',
        alerts: 'అలర్ట్స్',
        viewAllPatients: 'అందరి రోగులను చూడండి',

        // AI Insights
        aiHealthInsights: 'AI ఆరోగ్య అంతర్దృష్టులు',
        mlPowered: 'మెషీన్ లెర్నింగ్ ఆధారిత అంచనాలు',
        aiActive: 'AI యాక్టివ్',
        aiPrediction: 'AI అంచనా',
        positiveTrend: 'సానుకూల ధోరణి',
        riskAlert: 'ప్రమాద హెచ్చరిక',
        smartSuggestion: 'స్మార్ట్ సలహా',
        confidence: 'విశ్వాసం',

        // Alerts
        realTimeEmergency: 'రియల్ టైమ్ ఎమర్జెన్సీ',
        respondAll: 'అందరికీ స్పందించండి',
        sosAlert: 'SOS అలర్ట్',
        highHeartRate: 'అధిక హృదయ స్పందన',
        lowOxygen: 'తక్కువ ఆక్సిజన్',
        // ... (existing translations)

        // Devices Page
        loraMesh: 'లోరా మెష్ నెట్‌వర్క్',
        loraDeviceManagement: 'LoRa పరికర నిర్వహణ',
        deviceManagementSubtitle: 'LoRa నెట్‌వర్క్ ద్వారా ధరించగలిగిన పరికరాలను జత చేయండి మరియు నిర్వహించండి',
        scanForDevices: 'పరికరాల కోసం స్కాన్ చేయండి',
        devicesOffline: 'ఆఫ్‌లైన్ పరికరాలు',
        availableToPair: 'జత చేయడానికి అందుబాటులో ఉంది',
        pairedDevices: 'జత చేసిన పరికరాలు',
        deviceId: 'పరికర ID',
        patientName: 'రోగి పేరు',
        signalQuality: 'సిగ్నల్ నాణ్యత',
        lastSeen: 'చివరిగా చూసింది',
        batteryLevel: 'బ్యాటరీ %',
        pairDevice: 'పరికరాన్ని జత చేయండి',
        scanningNetwork: 'LoRa నెట్‌వర్క్‌ను స్కాన్ చేస్తోంది...',
        devicePairedSuccess: 'పరికరం విజయవంతంగా జత చేయబడింది!',

        // Patients Page
        patientsRegistry: 'రిజిస్ట్రీ',
        patientsSubtitle: 'రోగి రికార్డులు మరియు పరికర కేటాయింపులను నిర్వహించండి',
        contactFamily: 'సంప్రదింపు & కుటుంబం',
        deviceStatus: ' పరికరం స్థితి',
        conditionsRation: 'పరిస్థితులు / రేషన్',
        actions: 'చర్యలు',
        totalPatientsStat: 'మొత్తం రోగులు',
        onlineDevicesWeight: 'ఆన్‌లైన్ పరికరాలు',
        offlineDevicesWeight: 'ఆఫ్‌లైన్ పరికరాలు',
        criticalPatientsStat: 'క్రిటికల్ రోగులు',
        allStatus: 'అన్ని స్థితిగతులు',
        allVillages: 'అన్ని గ్రామాలు',

        // Sidebar Sections
        monitoring: 'పర్యవేక్షణ',
        careManagement: 'సంరక్షణ నిర్వహణ',
        infrastructure: 'మౌలిక సదుపాయాలు',
        quickAccess: 'త్వరిత ప్రాప్యత',
        familyPortal: 'కుటుంబ పోర్టల్',
        settings: 'అమరికలు',
        logout: 'లాగ్ అవుట్',

        // Settings Modal
        settingsTitle: 'అమరికలు',
        settingsDesc: 'మీ డాష్‌బోర్డ్‌ను అనుకూలీకరించండి',
        appearance: 'స్వరూపం',
        theme: 'థీమ్',
        themeDesc: 'లైట్ లేదా డార్క్ మోడ్ ఎంచుకోండి',
        light: 'లైట్',
        dark: 'డార్క్',
        language: 'భాష',
        languageDesc: 'ఇంటర్ఫేస్ భాషను ఎంచుకోండి',
        pushNotifications: 'పుష్ నోటిఫికేషన్లు',
        pushDesc: 'హెచ్చరిక నోటిఫికేషన్లను స్వీకరించండి',
        soundAlerts: 'సౌండ్ అలర్ట్స్',
        soundDesc: 'కీలకమైన హెచ్చరికల కోసం శబ్దాన్ని ప్లే చేయండి',
        dataPrivacy: 'డేటా & గోప్యత',
        autoRefresh: 'ఆటో రిఫ్రెష్',
        autoRefreshDesc: 'ప్రతి 5 సెకన్లకు వైటల్స్ అప్‌డేట్ చేయండి',
        demoCenter: 'డెమో సెంటర్ (డెవలపర్)',
        simulationMode: 'సిమ్యులేషన్ మోడ్',
        simulationDesc: 'యాదృచ్ఛిక వైటల్స్ డేటాను సృష్టించండి',
        startJuryDemo: 'జ్యూరీ డెమో ప్రారంభించండి',
        manualSOS: 'మాన్యువల్ SOS',
        done: 'పూర్తయింది',

        // Family Portal
        familyPortalTitle: 'కుటుంబ పోర్టల్',
        patientNotFound: 'రోగి కనుగొనబడలేదు',
        backToLogin: 'లాగిన్‌కి తిరిగి వెళ్లు',
        age: 'సంవత్సరాలు',
        dailySteps: 'రోజువారీ అడుగులు',
        todaysMedications: "నేటి మందులు",
        upcomingAppointments: 'రాబోయే అపాయింట్‌మెంట్‌లు',
        contactCareTeam: 'కేర్ టీమ్‌ను సంప్రదించండి',
        dataEncrypted: 'డేటా ఎన్‌క్రిప్ట్ చేయబడింది మరియు రక్షించబడింది',
        reportEmergency: 'ఎమర్జెన్సీని నివేదించండి',
        call: 'కాల్',
        callNow: 'ఇప్పుడే కాల్ చేయండి',
        cancel: 'రద్దు చేయండి',
        callConfirmTitle: 'కాల్',
        emergencyConfirmTitle: '🚨 ఇది ఎమర్జెన్సీ అలర్ట్‌ను ప్రేరేపిస్తుంది!',
        emergencyConfirmBody: 'క్రింది వారికి తెలియజేయబడుతుంది:\n- ఆశా వర్కర్\n- PHC డాక్టర్\n- అత్యవసర సేవలు\n\nకొనసాగించాలా?',
        emergencySentTitle: '✅ ఎమర్జెన్సీ అలర్ట్ పంపబడింది!',
        emergencySentBody: 'సహాయం వస్తోంది. మీకు 2 నిమిషాల్లో కాల్‌బ్యాక్ వస్తుంది.',
        allVitalsNormal: '✓ అన్ని వైటల్స్ సాధారణం',
        someVitalsWarning: '⚠ కొన్ని వైటల్స్ గమనించాలి',
        criticalContactTeam: '🚨 క్రిటికల్ - కేర్ టీమ్‌ను సంప్రదించండి',
        lastUpdated: 'చివరిగా నవీకరించబడింది',
        bpm: 'bpm',
        celsius: 'సెల్సియస్',
        mmHg: 'mmHg',
        adherence: 'పాటింపు',
        deviceOnline: 'పరికరం ఆన్‌లైన్',
        offline: 'ఆఫ్‌లైన్',
        currentHealthStatus: 'ప్రస్తుత ఆరోగ్య స్థితి',

        // Dashboard Extras
        mobileEMS: 'మొబైల్ EMS',
        tabletView: 'టాబ్లెట్ వీక్షణ',
        intelligence: 'ఇంటెలిజెన్స్',
        viewAnalytics: 'విశ్లేషణలను చూడండి',
        callRequest: 'కాల్ అభ్యర్థన',
        connecting: 'కనెక్ట్ అవుతోంది...',
        callPatient: 'రోగికి కాల్ చేయండి',
        viewProfile: 'ప్రొఫైల్ చూడండి',
        manageSchedules: 'షెడ్యూళ్లను నిర్వహించండి',
        viewAllAppointments: 'అన్ని అపాయింట్‌మెంట్‌లను చూడండి',

        // Analytics
        analyticsDashboard: 'అనలిటిక్స్ డాష్‌బోర్డ్',
        realtimeInsights: 'గ్రామీణ ఆరోగ్య కార్యకలాపాలపై రియల్ టైమ్ ఇన్సైట్స్',
        exportReport: 'నివేదిక ఎగుమతి',
        refreshData: 'డేటా రిఫ్రెష్',
        patientDistribution: 'గ్రామం వారీగా రోగుల పంపిణీ',
        systemHealth: 'సిస్టమ్ ఆరోగ్య స్థితి',
        ashaVisitCompletion: 'ఆశా సందర్శన పూర్తి (వారానికి)',
        heartRateTrend: 'సగటు హృదయ స్పందన ధోరణి (24 గం)',
        totalPatientsStats: 'మొత్తం రోగులు',
        criticalAlertsStats: 'క్రిటికల్ అలర్ట్స్',
        visitsToday: 'ఈ రోజు సందర్శనలు',
        avgAdherence: 'సగటు అనుసరణ',

        // Dispensers
        medicineDispensers: 'మందుల డిస్పెన్సర్లు',
        smartPillBoxes: 'స్మార్ట్ పిల్ బాక్సులు',
        registered: 'నమోదు చేయబడింది',
        // manageDispenserSchedules exists in Telegu Schedule section line 494
        devicesOnline: 'ఆన్‌లైన్ పరికరాలు',
        avgCompliance: 'సగటు సమ్మతి',
        lowBattery: 'తక్కువ బ్యాటరీ',
        totalDoses: 'మొత్తం మోతాదులు',
        allDispensers: 'అన్ని డిస్పెన్సర్లు',
        active: 'చురుకుగా',
        needsAttention: 'శ్రద్ధ అవసరం',
        filled: 'నింపబడింది',
        dispenserSlots: 'డిస్పెన్సర్ స్లాట్లు',
        signal: 'సిగ్నల్',
        strong: 'బలమైన',
        noSignal: 'సిగ్నల్ లేదు',

        // ASHA & Medicine
        ashaVerification: 'ఆశా ధృవీకరణ',
        ashaSubtitle: 'ఫీల్డ్ వర్కర్ సందర్శనలను ట్రాక్ చేయండి మరియు ధృవీకరించండి',
        ashaWorkers: 'ఆశా కార్యకర్తలు',
        visitLog: "నేటి సందర్శన చిట్టా",
        routine: 'రొటీన్',
        followup: 'ఫాలో-అప్',
        visits: 'సందర్శనలు',
        completion: 'పూర్తి',
        noVisits: 'ఈ రోజు సందర్శనలు ఏవీ నమోదు కాలేదు.',
        adherenceStream: 'అడ్హెరెన్స్ స్ట్రీమ్',
        liveTelemetry: 'లైవ్ డిస్పెన్సర్ టెలిమెట్రీ',
        combinedLog: 'కంబైన్డ్ లాగ్',
        scheduled: 'షెడ్యూల్ చేయబడింది',
        stationClean: 'స్టేషన్ క్లీన్ • అలర్ట్స్ లేవు',
        observedAt: 'వద్ద గమనించబడింది',
        taken: 'తీసుకోబడింది',
        missed: 'మిస్ అయింది',
        pending: 'పెండింగ్‌లో ఉంది',
        upcoming: 'రాబోయే',
        link: 'లింక్',
        sync: 'సింక్',
        today: 'ఈ రోజు',
        week: 'వారం',
        streak: 'వరుసగా',

        // Landing Page (Telugu)
        heroTitle1: 'ఆరోగ్య సంరక్షణ',
        heroTitle2: 'ప్రతిచోటా',
        heroTitle3: 'అందరి కోసం',
        heroSubtitle: 'మా పరికరాన్ని ధరించిన ప్రతి రోగి రిలే నోడ్‌గా మారితే - ప్రతి వినియోగదారుతో బలంగా పెరిగే స్వీయ-స్వస్థత మెష్ నెట్‌వర్క్‌ను రూపొందిస్తే? వైఫై లేదు. సిమ్ కార్డ్ లేదు. స్మార్ట్‌ఫోన్ లేదు.',
        experienceDemo: 'లైవ్ డెమోని అనుభవించండి',
        paramedicView: 'పారామెడిక్ EMS వీక్షణ',
        problemTitle: "గ్రామీణ భారతదేశం యొక్క నిశ్శబ్ద ఆరోగ్య అత్యవసరావస్థ",
        problemDesc: 'భారతదేశంలోని గ్రామీణ ప్రాంతాల్లో 150 మిలియన్ల వృద్ధులు నివసిస్తున్నారు. 70% మందికి సాధారణ ఆరోగ్య పర్యవేక్షణ లేదు. అత్యవసర పరిస్థితులు వచ్చినప్పుడు, సగటు ప్రతిస్పందన సమయం 45 నిమిషాలు.',
        solutionTitle: 'ఆయులింక్ — కనెక్ట్ చేయబడిన రక్షణ',
        solutionDesc: 'ఎవరికైనా, ఎక్కడైనా యూనివర్సల్ IoT హెల్త్ ప్లాట్‌ఫారమ్ — గ్రామీణ క్లినిక్‌లు, ఆసుపత్రులు, టెలిమెడిసిన్, గృహ సంరక్షణ. మాడ్యులర్ సెన్సార్లు. స్వీయ వైద్యం మెష్. ఆఫ్‌లైన్‌లో పని చేస్తోంది.',
        marketTitle: '₹45,000 కోట్ల అంతరం',
        featuresTitle: '9 ఇంటిగ్రేటెడ్ మాడ్యూల్స్',
        howItWorks: 'ఇది ఎలా పని చేస్తుంది',
        techStack: 'టెక్ స్టాక్',
        readyLive: 'దీన్ని ప్రత్యక్షంగా చూడటానికి సిద్ధంగా ఉన్నారా?',
        launchDashboard: 'డాష్‌బోర్డ్‌ను ప్రారంభించండి',
    },
}

// Default context value for SSR
const defaultContextValue: ThemeContextType = {
    theme: 'light',
    language: 'en',
    setTheme: () => { },
    setLanguage: () => { },
    gatewayIP: "192.168.4.1",
    setGatewayIP: () => { },
    t: (key: string) => translations.en[key] || key,
}

const ThemeContext = createContext<ThemeContextType>(defaultContextValue)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light')
    const [language, setLanguageState] = useState<Language>('en')
    const [gatewayIP, setGatewayIPState] = useState<string>('192.168.4.1')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('ayulinkTheme') as Theme
        const savedLanguage = localStorage.getItem('ayulinkLanguage') as Language
        const savedIP = localStorage.getItem('gatewayIP')
        if (savedTheme) setThemeState(savedTheme)
        if (savedLanguage) setLanguageState(savedLanguage)
        if (savedIP) setGatewayIPState(savedIP)
    }, [])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem('ayulinkTheme', theme)
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [theme, mounted])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem('ayulinkLanguage', language)
    }, [language, mounted])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem('gatewayIP', gatewayIP)
    }, [gatewayIP, mounted])

    const setTheme = (newTheme: Theme) => {
        // Add transitioning class to enable smooth transitions
        document.documentElement.classList.add('theme-transitioning')
        setThemeState(newTheme)
        // Remove transitioning class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning')
        }, 350)
    }

    const setLanguage = (newLanguage: Language) => {
        setLanguageState(newLanguage)
    }

    const setGatewayIP = (ip: string) => {
        setGatewayIPState(ip)
    }

    const t = (key: string): string => {
        return translations[language][key] || key
    }

    const contextValue: ThemeContextType = {
        theme,
        language,
        gatewayIP,
        setTheme,
        setLanguage,
        setGatewayIP,
        t,
    }

    // ALWAYS wrap children with context - this was the bug!
    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
