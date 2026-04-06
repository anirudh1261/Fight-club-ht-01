import { Patient } from '@/app/patients/page'

const VILLAGES = [
    'Hanamkonda', 'Waddepally', 'Kazipet', 'Mulugu Road', 
    'Hunter Road', 'Naimnagar', 'Bhimaram', 'Subedari', 'Warangal Fort'
]

export const VILLAGE_COORDS: Record<string, { lat: number, lng: number }> = {
    'Hanamkonda': { lat: 17.9719, lng: 79.5864 },
    'Waddepally': { lat: 17.96, lng: 79.57 },
    'Kazipet': { lat: 17.94, lng: 79.51 },
    'Mulugu Road': { lat: 17.98, lng: 79.62 },
    'Hunter Road': { lat: 17.95, lng: 79.59 },
    'Naimnagar': { lat: 17.975, lng: 79.58 },
    'Bhimaram': { lat: 17.99, lng: 79.56 },
    'Subedari': { lat: 17.97, lng: 79.58 },
    'Warangal Fort': { lat: 17.95, lng: 79.61 }
}

const FIRST_NAMES = [
    'Ramulu', 'Laxmi', 'Srinivas', 'Buchamma', 'Venkat', 'Padma', 'Raju', 'Sayamma',
    'Krishna', 'Sunita', 'Ramesh', 'Manjula', 'Narsimha', 'Susheela', 'Balu', 'Yadamma',
    'Chandra', 'Anita', 'Ravi', 'Kavitha', 'Gopal', 'Suvarna', 'Mallesh', 'Lalitha'
]

const LAST_NAMES = [
    'Goud', 'Reddy', 'Rao', 'Yadav', 'Sharma', 'Patel', 'Naidu', 'Kumar', 'Devi', 'Amma'
]

const CONDITIONS = [
    'Diabetes', 'Hypertension', 'Cardiac', 'Arthritis', 'COPD', 'Thyroid', 'Healthy', 'Asthma'
]

export const DEMO_PATIENT_COUNT = 45

export function generateDemoPatients(count: number = DEMO_PATIENT_COUNT): any[] {
    // Check if data exists in localStorage
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ayulink_demo_data_v3')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Ensure cached data has coordinates (for backward compatibility after recent changes)
                // Relax length check to allow for additional registered patients
                if (parsed.length >= count && parsed[0]?.lat !== undefined) return parsed;
            } catch (e) {
                console.error('Failed to parse demo data', e)
            }
        }
    }

    const data = Array.from({ length: count }).map((_, i) => {
        const village = VILLAGES[Math.floor(Math.random() * VILLAGES.length)]
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]

        // Generate realistic vitals based on condition
        let hr = 60 + Math.floor(Math.random() * 40)
        let spo2 = 90 + Math.floor(Math.random() * 10)

        if (condition === 'Cardiac') hr += 10
        if (condition === 'COPD') spo2 -= 2

        // Status logic
        let status = 'normal'
        if (hr > 100 || spo2 < 90) status = 'critical'
        else if (hr > 90 || spo2 < 94) status = 'warning'

        // Device status
        const deviceStatus = Math.random() > 0.15 ? 'online' : 'offline' // 85% online

        // Base coordinates for Warangal/Hanamkonda (17.9689, 79.5941)
        // Add significant noise (0.04 range ~ 4-5km)
        const lat = 17.9689 + (Math.random() * 0.04 - 0.02)
        const lng = 79.5941 + (Math.random() * 0.04 - 0.02)

        return {
            id: `P-${(i + 1).toString().padStart(3, '0')}`,
            name: `${firstName} ${lastName}`,
            age: 45 + Math.floor(Math.random() * 40),
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            deviceStatus: deviceStatus,
            lastReading: 'Just now',
            hr,
            spo2,
            phone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
            village,
            lat,
            lng,
            allergies: Math.random() > 0.8 ? ['Peanuts'] : [],
            conditions: condition === 'Healthy' ? [] : [condition],
            emergencyContact: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
            bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
            language: 'Telugu',
            abhaId: `${Math.floor(Math.random() * 99)}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}`,
            rationCardType: Math.random() > 0.6 ? 'BPL' : 'APL',
            familyHeadName: 'Self'
        }
    })

    // Save to localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('ayulink_demo_data_v3', JSON.stringify(data))
    }

    return data
}

export function getDemoStats() {
    const patients = generateDemoPatients()
    const villageStats: Record<string, { name: string, patients: number, online: number, alerts: number, status: string }> = {}

    patients.forEach(p => {
        if (!villageStats[p.village]) {
            villageStats[p.village] = { name: p.village, patients: 0, online: 0, alerts: 0, status: 'good' }
        }
        villageStats[p.village].patients++
        if (p.deviceStatus === 'online') {
            villageStats[p.village].online++
        }
        if (p.hr > 100 || p.spo2 < 90) {
            villageStats[p.village].alerts++
        }
    })

    // Update status based on alerts
    Object.values(villageStats).forEach(v => {
        if (v.alerts > 3) v.status = 'critical'
        else if (v.alerts > 0) v.status = 'warning'
        else v.status = 'good'
    })

    const totalPatients = patients.length
    const totalOnline = patients.filter(p => p.deviceStatus === 'online').length
    const totalAlerts = patients.filter(p => p.hr > 100 || p.spo2 < 90).length
    const criticalPatients = patients.filter(p => p.hr > 110 || p.spo2 < 85).length

    return {
        villages: Object.values(villageStats).sort((a, b) => b.patients - a.patients),
        totalPatients,
        totalOnline,
        totalAlerts,
        criticalPatients,
        healthScore: 82 // Consistent hardcoded-style demo score
    }
}

/**
 * Force clear demo cache so a fresh set (including new registrations) is loaded.
 */
export function reloadDemoData() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('ayulink_demo_data_v3')
    }
}

/**
 * Manually inject a patient into the demo localStorage so they show up everywhere in demo mode.
 */
export function registerDemoPatient(patient: any) {
    if (typeof window === 'undefined') return patient
    const saved = localStorage.getItem('ayulink_demo_data_v3')
    let data = saved ? JSON.parse(saved) : generateDemoPatients()
    
    // Assign coordinates if missing
    const center = VILLAGE_COORDS[patient.village] || { lat: 17.97, lng: 79.59 }
    const updatedPatient = {
        ...patient,
        lat: patient.lat || (center.lat + (Math.random() - 0.5) * 0.01),
        lng: patient.lng || (center.lng + (Math.random() - 0.5) * 0.01),
        deviceStatus: 'online',
        lastReading: 'Just now'
    }

    // Check if ID already exists
    const idx = data.findIndex((p: any) => p.id === patient.id)
    if (idx === -1) {
        data.unshift(updatedPatient)
        localStorage.setItem('ayulink_demo_data_v3', JSON.stringify(data))
    }
    
    return updatedPatient
}
