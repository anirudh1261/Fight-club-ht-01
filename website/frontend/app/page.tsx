'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme-context'
import MobileAccessModal from '@/components/MobileAccessModal'
import {
  Heart, Shield, Users, Radio, Clock, MapPin,
  Play, Building2, IndianRupee,
  Stethoscope, Smartphone, Wifi, CheckCircle, ArrowRight,
  Phone, Mail, Linkedin, Github, Siren, Zap, Pill,
  Activity, Eye, BarChart3, Bell, Globe, Cpu,
  ChevronDown, Sparkles, Network, Signal,
  TrendingUp, Layers, CircuitBoard, Droplets, HeartPulse,
  Thermometer, BatteryCharging, Package, Target, AlertTriangle
} from 'lucide-react'

/* ─── ANIMATED MESH CANVAS ─── */
function MeshCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = canvas.width = canvas.parentElement?.offsetWidth || 600
    let height = canvas.height = canvas.parentElement?.offsetHeight || 400
    let animationId: number
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; type: string; pulse: number }[] = []
    for (let i = 0; i < 22; i++) {
      nodes.push({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: i === 0 ? 8 : 3.5 + Math.random() * 3,
        type: i === 0 ? 'gateway' : i < 4 ? 'dispenser' : 'patient',
        pulse: Math.random() * Math.PI * 2
      })
    }
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.3
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`; ctx.lineWidth = 1; ctx.stroke()
            const t = (Date.now() * 0.001 + i * 0.3) % 1
            ctx.beginPath(); ctx.arc(nodes[i].x + (nodes[j].x - nodes[i].x) * t, nodes[i].y + (nodes[j].y - nodes[i].y) * t, 2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(45, 212, 191, ${alpha * 2})`; ctx.fill()
          }
        }
      }
      for (const node of nodes) {
        node.x += node.vx; node.y += node.vy; node.pulse += 0.02
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
        const glow = Math.sin(node.pulse) * 0.3 + 0.7
        const color = node.type === 'gateway' ? '16, 185, 129' : node.type === 'dispenser' ? '168, 85, 247' : '45, 212, 191'
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${0.06 * glow})`; ctx.fill()
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${0.8 * glow})`; ctx.fill()
      }
      animationId = requestAnimationFrame(draw)
    }
    draw()
    const handleResize = () => { width = canvas.width = canvas.parentElement?.offsetWidth || 600; height = canvas.height = canvas.parentElement?.offsetHeight || 400 }
    window.addEventListener('resize', handleResize)
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', handleResize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

/* ─── MODULAR SENSOR DATA ─── */
const sensorModules = [
  { name: 'SpO2 Module', desc: 'Blood oxygen saturation via MAX30102 sensor', icon: HeartPulse, color: 'from-red-500 to-rose-600', metric: '95-100%' },
  { name: 'ECG Module', desc: 'Single-lead electrocardiogram with AD8232', icon: Activity, color: 'from-blue-500 to-indigo-600', metric: '12-bit ADC' },
  { name: 'Glucometer Module', desc: 'Non-invasive blood glucose estimation', icon: Droplets, color: 'from-amber-500 to-orange-600', metric: '70-140 mg/dL' },
  { name: 'Temperature Module', desc: 'Precision body temp via MLX90614 IR', icon: Thermometer, color: 'from-emerald-500 to-teal-600', metric: '±0.1°C' },
  { name: 'Blood Pressure', desc: 'Oscillometric BP cuff with digital output', icon: TrendingUp, color: 'from-purple-500 to-violet-600', metric: 'SYS/DIA' },
  { name: 'Heart Rate', desc: 'PPG-based continuous heart rate monitoring', icon: Heart, color: 'from-pink-500 to-rose-600', metric: '40-220 BPM' },
]

/* ─── ALL FEATURES ─── */
const allFeatures = [
  { icon: Radio, title: 'LoRa Mesh Network', desc: 'Meshtastic-style self-healing mesh. Each patient device relays data — more patients = more range.', gradient: 'from-blue-500 to-cyan-500', badge: 'CORE' },
  { icon: Layers, title: 'Modular Sensors', desc: 'Hot-swappable sensor cartridges — ECG, SpO2, glucometer, BP. Plug any module into the universal base.', gradient: 'from-violet-500 to-purple-500', badge: 'HW' },
  { icon: Activity, title: 'Real-time Vitals', desc: 'SpO2, heart rate, temp, ECG, glucose — streamed live to PHC dashboard via LoRa mesh.', gradient: 'from-emerald-500 to-teal-500', badge: 'HEALTH' },
  { icon: Pill, title: 'Smart Dispensers', desc: '4-slot IoT pill boxes with scheduled dispensing, compliance tracking, and caregiver alerts.', gradient: 'from-purple-500 to-indigo-500', badge: 'IoT' },
  { icon: Siren, title: 'Emergency SOS', desc: 'Panic button → WebSocket dispatch → GPS ambulance → arrival in <3 minutes.', gradient: 'from-red-500 to-rose-500', badge: 'SOS' },
  { icon: Zap, title: 'AI Risk Scoring', desc: 'ML model scores patients 1-100 for emergency probability. Auto-escalates before crisis.', gradient: 'from-amber-500 to-orange-500', badge: 'AI' },
  { icon: Eye, title: 'Family Dashboard', desc: 'Remote family monitors elderly parents vitals, medications, and safety live from anywhere.', gradient: 'from-pink-500 to-rose-400', badge: 'FAMILY' },
  { icon: Stethoscope, title: 'ASHA Cockpit', desc: 'Visit tracking, scheme eligibility, vitals entry, automated reporting for ASHA workers.', gradient: 'from-sky-500 to-blue-500', badge: 'FIELD' },
  { icon: BarChart3, title: 'Analytics', desc: 'Village-level health trends, compliance heatmaps, exportable government reports.', gradient: 'from-teal-500 to-emerald-500', badge: 'DATA' },
]

const techStack = [
  { name: 'Next.js 14', role: 'Frontend', color: 'from-white/15 to-white/5' },
  { name: 'Supabase', role: 'Realtime DB', color: 'from-emerald-500/15 to-emerald-500/5' },
  { name: 'LoRa 433MHz', role: 'Mesh Radio', color: 'from-blue-500/15 to-blue-500/5' },
  { name: 'ESP32-S3', role: 'IoT Nodes', color: 'from-amber-500/15 to-amber-500/5' },
  { name: 'WebSocket', role: 'Live Sync', color: 'from-purple-500/15 to-purple-500/5' },
  { name: 'TensorFlow Lite', role: 'Edge AI', color: 'from-pink-500/15 to-pink-500/5' },
]

export default function LandingPage() {
  const router = useRouter()
  // Use theme context
  const { t } = useTheme() // Added hook
  const [showMobileAccess, setShowMobileAccess] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* ═══ NAV ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-8 py-4 transition-all duration-500 ${scrollY > 50 ? 'bg-[#0a0e1a]/95 backdrop-blur-2xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 p-1">
              <img src="/ayulink_logo.png" alt="AyuLink Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">Ayu<span className="text-teal-400">Link</span></span>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold">Smart Health. Zero Boundaries.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Problem', 'Solution', 'Market', 'Hardware', 'Features', 'Tech'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} className="text-xs text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-[0.15em] font-bold">{s}</a>
            ))}
          </div>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-sm hover:shadow-lg hover:shadow-teal-500/25 hover:scale-105 transition-all tracking-wide">
            {t('experienceDemo')} →
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 opacity-30"><MeshCanvas /></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 py-12 text-center w-full">
          {/* Hackfest badge */}


          {/* USP strip */}
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            {['LoRa Mesh Network', 'Modular Sensors', 'Zero Internet', 'AI Triage', 'Paramedic EMS', 'Telemedicine', 'Hospital Ready'].map((usp, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {usp}
              </span>
            ))}
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.85] mb-8 tracking-tighter">
            <span className="block text-white/90">{t('heroTitle1')}</span>
            <span className="block bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent py-3">{t('heroTitle2')}</span>
            <span className="block text-white/90">{t('heroTitle3')}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-lg hover:shadow-2xl hover:shadow-teal-500/25 hover:scale-105 transition-all">
              <Play className="h-5 w-5" /> {t('experienceDemo')}
            </button>
            <button onClick={() => setShowMobileAccess(true)} className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl border border-white/10 bg-white/3 font-bold text-lg hover:bg-white/5 transition-all text-slate-300">
              <Siren className="h-5 w-5" /> {t('paramedicView')}
            </button>
          </div>

          {/* Key Impact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
            {[
              { v: '150M+', l: 'Target Users', d: 'Patients anywhere — rural, urban, hospitals', c: 'text-teal-400' },
              { v: '<3 min', l: 'SOS → Rescue', d: 'Emergency response time', c: 'text-red-400' },
              { v: '10km+', l: 'Mesh Range', d: 'Per relay, expandable', c: 'text-blue-400' },
              { v: '₹0', l: 'Internet Cost', d: 'Works with or without internet', c: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all">
                <p className={`text-3xl md:text-4xl font-black ${s.c}`}>{s.v}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">{s.l}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{s.d}</p>
              </div>
            ))}
          </div>

          {/* Key Differentiators Row — "Why We Win" */}
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold mb-4">5 Innovations • 1 Platform</p>
            <div className="grid grid-cols-5 gap-3">
              {[
                { icon: Radio, label: 'LoRa Mesh', sub: 'Self-healing network', c: 'from-blue-500 to-cyan-500' },
                { icon: Layers, label: 'Modular HW', sub: 'Swappable sensors', c: 'from-violet-500 to-purple-500' },
                { icon: Siren, label: 'Paramedic EMS', sub: 'Dedicated dashboard', c: 'from-red-500 to-rose-500' },
                { icon: Zap, label: 'AI Triage', sub: 'Risk scoring ML', c: 'from-amber-500 to-orange-500' },
                { icon: Pill, label: 'Smart Dispenser', sub: 'IoT pill boxes', c: 'from-purple-500 to-indigo-500' },
              ].map((d, i) => (
                <div key={i} className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all text-center">
                  <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${d.c} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                    <d.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-white">{d.label}</p>
                  <p className="text-[10px] text-slate-600">{d.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 animate-bounce"><ChevronDown className="h-6 w-6 text-slate-600 mx-auto" /></div>
        </div>
      </section>

      {/* ═══ PROBLEM ═══ */}
      <section id="problem" className="py-28 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/8 border border-red-500/15 text-red-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <AlertTriangle className="h-4 w-4" /> The Crisis
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                {t('problemTitle')}
              </h2>
              <p className="text-base text-slate-400 leading-relaxed mb-10">
                {t('problemDesc')}
              </p>
              <div className="space-y-5">
                {[
                  { t: 'No Connectivity', d: 'Only 35% of rural India has reliable internet. Existing telemedicine fails without WiFi.' },
                  { t: 'No Monitoring', d: 'Chronic conditions like diabetes, hypertension go undetected until crisis.' },
                  { t: 'No Infrastructure', d: '1 PHC serves 30,000+ people. ASHA workers manage 1,000 households each on paper.' },
                ].map((p, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white mb-1">{p.t}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: '70%', t: 'No Monitoring', d: 'Rural elderly without health checkups', c: 'text-red-400' },
                { n: '45 min', t: 'Response Delay', d: 'vs 8 min in urban areas', c: 'text-orange-400' },
                { n: '₹12K', t: 'Annual Burden', d: 'Per household healthcare cost', c: 'text-amber-400' },
                { n: '65%', t: 'Internet Gap', d: 'Rural areas without connectivity', c: 'text-rose-400' },
              ].map((s, i) => (
                <div key={i} className="p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all">
                  <div className={`text-4xl font-black ${s.c} mb-2`}>{s.n}</div>
                  <p className="text-sm font-bold text-white mb-1 uppercase tracking-wide">{s.t}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARKET OPPORTUNITY ═══ */}
      <section id="market" className="py-28 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-indigo-950/20 to-[#0a0e1a]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/8 border border-indigo-500/15 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <TrendingUp className="h-4 w-4" /> {t('marketTitle')}
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">A <span className="text-indigo-400">₹45,000 Crore</span> Gap</h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">India&apos;s rural healthtech market is massively underserved. The problem is growing faster than solutions.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              { label: 'Total Addressable Market', value: '₹45,000 Cr', sub: 'Rural healthtech by 2028', color: 'text-indigo-400' },
              { label: 'Serviceable Market', value: '₹8,500 Cr', sub: 'IoT health monitoring segment', color: 'text-purple-400' },
              { label: 'Initial Target', value: '₹1,200 Cr', sub: 'Elderly care in 6 priority states', color: 'text-teal-400' },
            ].map((m, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center hover:border-white/10 transition-all">
                <p className="text-xs text-slate-500 uppercase tracking-[0.15em] font-bold mb-4">{m.label}</p>
                <p className={`text-5xl font-black ${m.color} mb-2`}>{m.value}</p>
                <p className="text-sm text-slate-500">{m.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-base font-bold mb-5 text-white uppercase tracking-wide">Existing Solutions Fail Because</h3>
              <div className="space-y-4">
                {[
                  'Require internet — 65% rural India has none',
                  'Need smartphones — only 40% rural penetration',
                  'Fixed-sensor wearables — one device can\'t cover all vitals',
                  'No mesh networking — single point of failure in coverage',
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-red-400 text-sm font-bold">✕</span></div>
                    <p className="text-sm text-slate-400 leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-base font-bold mb-5 text-white uppercase tracking-wide">AyuLink Solves This With</h3>
              <div className="space-y-4">
                {[
                  'LoRa mesh — works with zero internet, zero WiFi',
                  'Hardware-only SOS — no phone needed, just press button',
                  'Modular sensor slots — plug in ECG today, glucometer tomorrow',
                  'Patient-as-Infrastructure — each device extends network range',
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="h-3.5 w-3.5 text-teal-400" /></div>
                    <p className="text-sm text-slate-400 leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOLUTION ═══ */}
      <section id="solution" className="py-28 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[200px]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/8 border border-teal-500/15 text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles className="h-4 w-4" /> {t('solutionTitle')}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">AyuLink — <span className="text-teal-400">Connected Care</span></h2>
          <p className="text-base text-slate-400 mb-14 max-w-xl">{t('solutionDesc')}</p>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: Radio, title: 'LoRa Mesh Network', desc: 'Meshtastic-style mesh relay. Each patient wearable is a relay node — more patients = more range. 10km+ coverage.', g: 'from-blue-500 to-cyan-500' },
              { icon: Layers, title: 'Modular Sensor Design', desc: 'Universal wearable base with hot-swappable sensor cartridges. Plug in ECG, SpO2, glucometer, BP based on patient needs.', g: 'from-violet-500 to-purple-500' },
              { icon: Pill, title: 'Smart Medicine Dispensers', desc: '4-slot IoT pill boxes with LoRa connectivity. Schedules, compliance tracking, missed-dose alerts to caregivers.', g: 'from-purple-500 to-indigo-500' },
              { icon: Siren, title: 'Emergency SOS → Paramedic', desc: 'One-button panic → WebSocket dispatch → GPS-tracked ambulance → paramedic arrival in <3 minutes.', g: 'from-red-500 to-rose-500' },
            ].map((f, i) => (
              <div key={i} className="group flex gap-5 p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-teal-500/20 transition-all">
                <div className={`w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br ${f.g} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                  <f.icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARAMEDIC EMS DASHBOARD ═══ */}
      <section className="py-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/15 via-orange-950/10 to-red-950/15" />
        <div className="max-w-7xl mx-auto relative">
          <div className="rounded-3xl border border-red-500/15 bg-gradient-to-br from-red-500/[0.04] to-orange-500/[0.04] p-10 md:p-14">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                  <Siren className="h-4 w-4" /> Dedicated Paramedic Portal
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                  Separate <span className="text-red-400">EMS Dashboard</span> for Paramedics
                </h2>
                <p className="text-base text-slate-400 mb-8 leading-relaxed">
                  When every second counts, paramedics get their own <strong className="text-white">dedicated mobile-first dashboard</strong> —
                  purpose-built for emergency response. No clutter, no logins. Just the critical info to save lives.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: MapPin, label: 'GPS Dispatch', desc: 'Live patient location + fastest route' },
                    { icon: Activity, label: 'Vitals Preview', desc: 'Patient vitals before arrival' },
                    { icon: Phone, label: 'One-Tap Nav', desc: 'Google Maps integration' },
                    { icon: Clock, label: '<3 min ETA', desc: 'Average response time' },
                  ].map((f, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <f.icon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{f.label}</p>
                        <p className="text-xs text-slate-500">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowMobileAccess(true)} className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 font-bold text-base hover:shadow-xl hover:shadow-red-500/20 hover:scale-105 transition-all">
                  <Siren className="h-5 w-5" /> Open Paramedic Dashboard
                </button>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { n: '<3 min', t: 'Avg Response', c: 'text-red-400', bg: 'bg-red-500/8' },
                    { n: '1-Tap', t: 'GPS Navigate', c: 'text-orange-400', bg: 'bg-orange-500/8' },
                    { n: 'Live', t: 'Vitals Feed', c: 'text-amber-400', bg: 'bg-amber-500/8' },
                    { n: 'QR Scan', t: 'Patient Handoff', c: 'text-rose-400', bg: 'bg-rose-500/8' },
                  ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-2xl ${s.bg} border border-white/[0.06] text-center`}>
                      <p className={`text-3xl font-black ${s.c} mb-1`}>{s.n}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.t}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-sm font-bold text-white">Emergency Flow</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 font-bold">SOS Button</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 font-bold">WebSocket</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-bold">Paramedic App</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold">Rescue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MODULAR SENSOR DESIGN (KEY INNOVATION) ═══ */}
      <section id="hardware" className="py-28 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/20 via-transparent to-blue-950/20" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/8 border border-violet-500/15 text-violet-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <CircuitBoard className="h-4 w-4" /> Hardware Innovation
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                <span className="text-violet-400">Modular</span> Sensor Architecture
              </h2>
              <p className="text-base text-slate-400 mb-10 leading-relaxed">
                One universal wearable base. <strong className="text-white">Hot-swappable sensor cartridges</strong>.
                Need ECG today? Plug it in. Blood glucose tomorrow? Swap the module. No new device needed.
              </p>
              <div className="space-y-5">
                {[
                  { t: 'Universal Base Unit', d: 'ESP32-S3 + LoRa radio + battery + SOS button. Accepts any sensor module via standardized I2C/SPI connector.' },
                  { t: 'Replaceable Sensor Pods', d: 'Click-in cartridges for each vital: SpO2, ECG, glucometer, temperature, BP. Community health workers swap modules per patient needs.' },
                  { t: 'Future-Proof Design', d: 'New sensors (EEG, respiratory, etc.) can be added without replacing hardware. Firmware auto-detects connected module.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/8 border border-violet-500/15 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-violet-500/15 transition-colors">
                      <CheckCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{item.t}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Sensor Module Grid */}
            <div className="grid grid-cols-2 gap-4">
              {sensorModules.map((s, i) => (
                <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <s.icon className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1.5">{s.name}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{s.desc}</p>
                  <div className="px-3 py-1 rounded-lg bg-white/[0.05] inline-block">
                    <span className="text-xs font-bold text-slate-400 tracking-wider">{s.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MESH NETWORK EFFECT ═══ */}
      <section className="py-28 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/8 border border-teal-500/15 text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <Network className="h-4 w-4" /> Network Effect
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                More Patients = <span className="text-teal-400">More Range</span>
              </h2>
              <p className="text-base text-slate-400 mb-10 leading-relaxed">
                Unlike traditional systems, AyuLink gets <strong className="text-teal-400">stronger</strong> with adoption. Inspired by <strong className="text-white">Meshtastic</strong>.
                Each patient wearable is a mesh relay node.
              </p>
              <div className="space-y-5">
                {[
                  { t: 'Patient-as-Infrastructure', d: 'Add 1 patient → mesh range extends 2km. 50 patients = 15km+ self-healing village network.' },
                  { t: 'Redundant Routing', d: 'Node failure? Data auto-reroutes through nearest neighbors. Zero single points of failure.' },
                  { t: 'Zero Infra Cost', d: 'No cell towers, no WiFi, no internet plans. Patients ARE the infrastructure.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{item.t}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
              <MeshCanvas />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center"><div className="text-6xl font-black text-teal-400/25 mb-2">∞</div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Infinite Scalability</p></div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex gap-3">
                {[{ p: '5', r: '2 km', w: 'w-1/4' }, { p: '20', r: '8 km', w: 'w-2/4' }, { p: '50+', r: '15 km+', w: 'w-full' }].map((r, i) => (
                  <div key={i} className={`${r.w} p-3 rounded-xl bg-black/60 backdrop-blur border border-teal-500/15 text-center`}>
                    <p className="text-teal-400 font-black text-base">{r.r}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{r.p} patients</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ALL FEATURES ═══ */}
      <section id="features" className="py-28 px-8 bg-gradient-to-b from-[#0a0e1a] via-slate-900/30 to-[#0a0e1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/15 text-purple-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Cpu className="h-4 w-4" /> Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">9 Integrated <span className="text-purple-400">Modules</span></h2>
            <p className="text-base text-slate-400 max-w-lg mx-auto">End-to-end rural healthcare platform. Every feature designed for ground reality.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allFeatures.map((f, i) => (
              <div key={i} className="group p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <f.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f.badge}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-28 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Globe className="h-4 w-4" /> {t('howItWorks')}
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{t('howItWorks')}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="absolute top-[70px] left-[14%] right-[14%] h-px bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20 hidden md:block" />
            {[
              { icon: Signal, title: 'Patient Wearable', desc: 'Modular sensor base + LoRa radio + SOS button', color: 'teal', step: '01' },
              { icon: Radio, title: 'Mesh Relay', desc: 'Data hops through patient nodes — each extends range 2km', color: 'blue', step: '02' },
              { icon: Wifi, title: 'Village Gateway', desc: 'Hub at PHC — ASHA dashboard shows every patient live', color: 'indigo', step: '03' },
              { icon: Smartphone, title: 'Family + Cloud', desc: 'Supabase syncs to family app. Analytics, compliance, reports', color: 'purple', step: '04' },
            ].map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className={`relative mx-auto mb-6 w-20 h-20 rounded-2xl bg-white/[0.03] border border-${s.color}-500/15 flex items-center justify-center group-hover:border-${s.color}-500/30 group-hover:bg-${s.color}-500/5 transition-all`}>
                  <s.icon className={`h-9 w-9 text-${s.color}-400`} />
                  <div className={`absolute -top-2.5 -right-2.5 w-8 h-8 rounded-lg bg-${s.color}-500 text-white text-xs font-black flex items-center justify-center shadow-lg`}>{s.step}</div>
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TECH STACK ═══ */}
      <section id="tech" className="py-28 px-8 bg-gradient-to-b from-[#0a0e1a] to-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/8 border border-amber-500/15 text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Cpu className="h-4 w-4" /> Built With
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Tech <span className="text-amber-400">Stack</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((t, i) => (
              <div key={i} className={`p-6 rounded-2xl bg-gradient-to-b ${t.color} border border-white/[0.06] text-center hover:border-white/10 transition-all hover:scale-105`}>
                <p className="font-black text-lg mb-1">{t.name}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em]">{t.role}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/15">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold mb-2">Government-Ready Architecture</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Designed for <strong className="text-white">ABHA</strong> digital health framework,
                <strong className="text-white"> Ayushman Bharat</strong> scheme eligibility, and
                <strong className="text-white"> NRHM</strong> reporting standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-28 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/30 to-transparent" />
        <div className="absolute inset-0 opacity-15"><MeshCanvas /></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            {t('readyLive')}
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto">
            Full working prototype. Real Supabase backend. Live LoRa mesh simulation. Modular sensor architecture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 font-black text-xl hover:shadow-2xl hover:shadow-teal-500/25 hover:scale-105 transition-all">
              {t('launchDashboard')} <ArrowRight className="h-6 w-6" />
            </button>
            <button onClick={() => setShowMobileAccess(true)} className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl border border-white/10 font-bold text-xl hover:bg-white/5 transition-all">
              <Phone className="h-5 w-5" /> {t('mobileEMS')}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 px-8 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center p-0.5">
              <img src="/ayulink_logo.png" alt="AyuLink Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <span className="font-bold text-sm">AyuLink</span>
            <span className="text-xs text-slate-600">by Antigravity</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 AyuLink — Healthcare Infrastructure Challenge</p>
          <div className="flex gap-3">
            {[Github, Linkedin, Mail].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"><Icon className="h-4 w-4 text-slate-500" /></a>
            ))}
          </div>
        </div>
      </footer>

      <MobileAccessModal isOpen={showMobileAccess} onClose={() => setShowMobileAccess(false)} url={typeof window !== 'undefined' ? `${window.location.origin}/paramedic/dashboard` : '/paramedic/dashboard'} />
    </div>
  )
}
