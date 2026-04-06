
interface RiskData {
    hr: number
    spo2: number
    temp: number
    activity?: string // "resting", "walking", "running", "fall"
}

export interface RiskAnalysis {
    score: number // 0-100
    level: 'Low' | 'Moderate' | 'High' | 'Critical'
    factors: string[]
    color: string
}

export function calculateRiskScore(data: RiskData): RiskAnalysis {
    let score = 0
    const factors: string[] = []

    // Heart Rate Logic
    if (data.hr > 120) {
        score += 40
        factors.push("Critical Tachycardia (HR > 120)")
    } else if (data.hr > 100) {
        score += 20
        factors.push("Tachycardia (HR > 100)")
    } else if (data.hr < 40 && data.hr > 0) {
        score += 30
        factors.push("Bradycardia (HR < 40)")
    }

    // SpO2 Logic
    if (data.spo2 < 85 && data.spo2 > 0) {
        score += 50
        factors.push("Critical Hypoxia (SpO2 < 85%)")
    } else if (data.spo2 < 90 && data.spo2 > 0) {
        score += 30
        factors.push("Hypoxia Warning (SpO2 < 90%)")
    } else if (data.spo2 < 95 && data.spo2 > 0) {
        score += 15
        factors.push("Low Oxygen Saturation (SpO2 < 95%)")
    }

    // Temperature Logic
    if (data.temp > 39) {
        score += 25
        factors.push("High Fever (> 39°C)")
    } else if (data.temp > 38) {
        score += 10
        factors.push("Fever Detected (> 38°C)")
    } else if (data.temp < 35 && data.temp > 0) {
        score += 25
        factors.push("Hypothermia Risk (< 35°C)")
    }

    // Activity Logic
    if (data.activity === 'fall') {
        score += 50
        factors.push("Fall Detected")
    }

    // Cap Score at 100
    score = Math.min(score, 100)

    // Determine Level & Color
    let level: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low'
    let color = '#10b981' // Green

    if (score >= 80) {
        level = 'Critical'
        color = '#ef4444' // Red
    } else if (score >= 50) {
        level = 'High'
        color = '#f97316' // Orange
    } else if (score >= 20) {
        level = 'Moderate'
        color = '#eab308' // Yellow
    }

    return { score, level, factors, color }
}

export interface RiskTrendPoint {
    hour: number
    score: number
    level: string
    color: string
}

export function predictRiskTrend(history: RiskData[]): RiskTrendPoint[] {
    // If we have fewer than 2 data points, generate a flat trend
    if (history.length < 2) {
        const current = history.length > 0 ? calculateRiskScore(history[0]) : { score: 0, level: 'Low', color: '#10b981' }
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            score: current.score,
            level: current.level,
            color: current.color
        }))
    }

    // Calculate trend from recent readings using linear regression
    const scores = history.slice(-12).map(d => calculateRiskScore(d).score)
    const n = scores.length
    const avgX = (n - 1) / 2
    const avgY = scores.reduce((a, b) => a + b, 0) / n
    const slope = scores.reduce((sum, y, x) => sum + (x - avgX) * (y - avgY), 0) /
        scores.reduce((sum, _, x) => sum + (x - avgX) ** 2, 0)

    const lastScore = scores[scores.length - 1]

    return Array.from({ length: 24 }, (_, i) => {
        const predicted = Math.max(0, Math.min(100, lastScore + slope * i * 0.5))
        const level = predicted >= 80 ? 'Critical' : predicted >= 50 ? 'High' : predicted >= 20 ? 'Moderate' : 'Low'
        const color = predicted >= 80 ? '#ef4444' : predicted >= 50 ? '#f97316' : predicted >= 20 ? '#eab308' : '#10b981'
        return { hour: i, score: Math.round(predicted), level, color }
    })
}
