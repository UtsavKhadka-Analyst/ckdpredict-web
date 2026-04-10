import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import TierBadge from '../components/TierBadge'
import api from '../api/client'

const TIER_COLOR = { URGENT:'#DC2626', HIGH:'#EA580C', MODERATE:'#CA8A04', LOW:'#16A34A' }
const TIER_BG    = { URGENT:'#FEF2F2', HIGH:'#FFF7ED', MODERATE:'#FEFCE8', LOW:'#F0FDF4' }

const ACTIONS = {
  URGENT:   [['📞','Contact your care team or nephrologist today'],['🏥','Go to Emergency for severe swelling, shortness of breath, or sudden pain'],['💊','Do not stop medications without speaking to your doctor'],['📋','Bring your full medication list to your next visit']],
  HIGH:     [['📅','Schedule an appointment within the next 2 weeks'],['💊','Review your current medications with your doctor'],['🩺','Ask your doctor about eGFR and UACR testing'],['🥗','Reduce sodium intake (< 2g/day)']],
  MODERATE: [['📅','Book a routine follow-up in the next 3–6 months'],['🥗','Follow a kidney-friendly diet — low sodium, low processed food'],['🏃','Aim for 30 minutes of moderate exercise most days'],['📊','Monitor your blood pressure regularly']],
  LOW:      [['📅','Annual kidney health screening recommended'],['🥗','Maintain a balanced, low-sodium diet'],['🏃','Stay physically active'],['📊','Keep blood pressure below 130/80 mmHg']],
}

const SESSION_MINUTES = 10

export default function PatientPortal() {
  const [pt, setPt]           = useState(null)
  const [tab, setTab]         = useState('overview')
  const [error, setError]     = useState('')
  const [timeLeft, setTimeLeft] = useState(SESSION_MINUTES * 60)
  const { logout }            = useAuth()
  const navigate              = useNavigate()
  const timerRef              = useRef(null)

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          logout()
          navigate('/patient-login')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [logout, navigate])

  // Reset timer on interaction
  const resetTimer = () => setTimeLeft(SESSION_MINUTES * 60)

  useEffect(() => {
    api.get('/patient/me')
      .then(r => setPt(r.data))
      .catch(() => setError('Unable to load your record. Please sign in again.'))
  }, [])

  const handleSignOut = () => { logout(); navigate('/patient-login') }

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')
  const timerUrgent = timeLeft < 120

  if (error) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={handleSignOut} className="btn-primary mt-4 text-sm">Return to Login</button>
      </div>
    </div>
  )

  if (!pt) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">🫘</div><p className="text-gray-400">Loading your health summary…</p></div>
    </div>
  )

  const color  = TIER_COLOR[pt.urgency_tier] ?? '#14B8A6'
  const bg     = TIER_BG[pt.urgency_tier]   ?? '#f0fdfa'
  const riskPct = Math.round(pt.risk_score * 100)
  const actions = ACTIONS[pt.urgency_tier] ?? ACTIONS.LOW

  return (
    <div className="min-h-screen bg-gray-50" onClick={resetTimer}>
      {/* Top nav */}
      <header className="bg-navy px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-base">🫘</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">My Kidney Health</p>
            <p className="text-white/40 text-xs">Patient Portal · CKDPredict</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Session timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold ${
            timerUrgent ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/60'
          }`}>
            <Clock size={12} />
            {mins}:{secs}
          </div>
          <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full">
            Patient Portal
          </span>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Session warning */}
      {timerUrgent && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <p className="text-red-700 text-xs font-medium">
            Session expiring in {mins}:{secs} — click anywhere to extend
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2">
        <AlertCircle size={13} className="text-amber-500 shrink-0" />
        <p className="text-amber-800 text-xs">
          <strong>Educational information only</strong> — not a medical diagnosis. For urgent symptoms call 911.
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Risk card */}
        <div className="card mb-6 border-t-4" style={{ borderTopColor: color }}>
          <div className="flex items-center gap-6">
            {/* Dial */}
            <div
              className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-8 shrink-0"
              style={{ borderColor: color, background: bg }}
            >
              <span className="text-3xl font-black font-mono" style={{ color }}>{riskPct}%</span>
              <span className="text-xs font-semibold mt-0.5" style={{ color }}>risk</span>
            </div>
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={pt.urgency_tier} />
                <span className="text-xs text-gray-400">· {pt.est_months}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {pt.urgency_tier === 'URGENT' ? '⚠️ Please contact your care team today'
                  : pt.urgency_tier === 'HIGH' ? '📅 Schedule a follow-up soon'
                  : pt.urgency_tier === 'MODERATE' ? '👁️ Stay on track with monitoring'
                  : '✅ Keep up the good work'}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {pt.urgency_tier === 'URGENT'
                  ? 'Your kidney health risk score is in the highest category. Please reach out to your care team as soon as possible.'
                  : pt.urgency_tier === 'HIGH'
                  ? 'Your risk score is elevated. Scheduling a visit within the next 2 weeks is strongly recommended.'
                  : pt.urgency_tier === 'MODERATE'
                  ? 'Your risk is moderate. Lifestyle changes and regular monitoring can prevent progression.'
                  : 'Your risk is currently low. Keep attending annual screenings and maintaining healthy habits.'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${riskPct}%`, background: color }} />
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1.5">
              <span>0% LOW</span><span>40% MODERATE</span><span>65% HIGH</span><span>85% URGENT</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-100 pb-0">
          {[['overview','📊 Overview'],['actions','✅ My Action List'],['learn','📚 Learn & Ask']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === k ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Details</p>
                <div className="space-y-2.5">
                  {[['Risk Score', `${riskPct}%`], ['Risk Tier', pt.urgency_tier], ['Timeline', pt.est_months], ['Care Pathway', pt.pathway ?? 'Standard']].map(([l,v]) => (
                    <div key={l} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-gray-500 text-xs">{l}</span>
                      <span className="font-semibold text-gray-800 text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ background: bg, borderColor: color + '33' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color }}>Why this matters</p>
                <div className="space-y-2">
                  {[['No CKD', '$13,604/yr', '#16A34A'], ['CKD Stage 3', '$28,162/yr', '#EA580C']].map(([l,v,c]) => (
                    <div key={l} className="flex justify-between items-center bg-white rounded-xl px-3 py-2">
                      <span className="text-xs text-gray-500">{l}</span>
                      <span className="text-sm font-black" style={{ color: c }}>{v}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 text-center mt-1">Annual Medicare cost · USRDS 2023</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {tab === 'actions' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800 mb-4">Your next steps based on your risk tier:</p>
            {actions.map(([icon, text], i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ background: bg }}>{icon}</div>
                <div>
                  <p className="text-xs font-bold mb-0.5" style={{ color }}>Step {i + 1}</p>
                  <p className="text-sm text-gray-800">{text}</p>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[['If CKD develops untreated','$28,162','per year','#FFF7ED','#FED7AA','#EA580C'],['With early intervention','$13,604','potential saving of $14,558/yr','#F0FDF4','#BBF7D0','#16A34A']].map(([l,v,s,bg2,bd,c]) => (
                <div key={l} className="rounded-2xl border p-4" style={{ background: bg2, borderColor: bd }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: c }}>{l}</p>
                  <p className="text-2xl font-black" style={{ color: c }}>{v}</p>
                  <p className="text-xs mt-0.5" style={{ color: c }}>{s}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">Source: USRDS 2023</p>
          </div>
        )}

        {/* Learn */}
        {tab === 'learn' && (
          <div className="space-y-3">
            {[
              ['🫘 What is CKD Stage 3?', 'Chronic Kidney Disease Stage 3 means your kidneys are working at 30–59% of normal capacity (eGFR 30–59). Most people have no symptoms at this stage, which is why early detection is critical.\n\nReference: KDIGO 2024'],
              ['📊 What does my risk score mean?', '0–40% LOW — Continue regular monitoring\n40–65% MODERATE — Discuss with your doctor\n65–85% HIGH — Schedule appointment soon\n85–100% URGENT — Contact your doctor today\n\nReference: KDIGO 2024 · Tangri et al. 2016'],
              ['💊 What can slow CKD progression?', '• Blood pressure below 130/80 mmHg\n• HbA1c below 7% (if diabetic)\n• ACE inhibitors or ARB medications\n• SGLT2 inhibitors (if diabetic or UACR ≥ 200)\n• Low-sodium diet (under 2g/day)\n• Regular moderate exercise\n\nReference: KDIGO 2024 · ADA 2023'],
              ['📞 Who should I contact?', '• Urgent symptoms (swelling, breathing difficulty, sudden pain): Call 911\n• Risk questions: Call your primary care physician\n• Specialist care: Ask for a nephrology referral\n• This tool: Discuss results at your next visit'],
            ].map(([q, a]) => (
              <details key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm group overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-800 text-sm list-none">
                  {q}
                  <span className="text-gray-400 text-lg group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-50 pt-3">{a}</div>
              </details>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-5 border-t border-gray-100 mt-8">
        CKDPredict · Educational use only · Not a medical diagnosis · KDIGO 2024 / USRDS 2023
      </footer>
    </div>
  )
}
