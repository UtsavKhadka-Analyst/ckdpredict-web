import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import TierBadge from '../components/TierBadge'
import api from '../api/client'

const ACTIONS = {
  URGENT:   [
    ['📞', 'Contact your care team or nephrologist today'],
    ['🏥', 'Go to Emergency for severe swelling, shortness of breath, or sudden pain'],
    ['💊', 'Do not stop medications without speaking to your doctor'],
    ['📋', 'Bring your medication list to your next visit'],
  ],
  HIGH:     [
    ['📅', 'Schedule an appointment within the next 2 weeks'],
    ['💊', 'Review your current medications with your doctor'],
    ['🩺', 'Ask your doctor about eGFR and UACR testing'],
    ['🥗', 'Start reducing sodium intake (< 2g/day)'],
  ],
  MODERATE: [
    ['📅', 'Book a routine follow-up in the next 3–6 months'],
    ['🥗', 'Follow a kidney-friendly diet — low sodium, low processed food'],
    ['🏃', 'Aim for 30 minutes of moderate exercise most days'],
    ['📊', 'Monitor your blood pressure regularly'],
  ],
  LOW:      [
    ['📅', 'Annual kidney health screening recommended'],
    ['🥗', 'Maintain a balanced, low-sodium diet'],
    ['🏃', 'Stay physically active'],
    ['📊', 'Keep blood pressure below 130/80 mmHg'],
  ],
}

const TIMELINE_MSG = {
  URGENT:   { headline: '⚠️ Act now', body: 'Your model score places you in the highest-risk category. Please contact your care team as soon as possible — early action can significantly slow kidney disease progression.', cta: 'Call your doctor today' },
  HIGH:     { headline: '📅 Schedule soon', body: 'Your risk score is elevated. Scheduling an appointment within the next 2 weeks and discussing your results with your care team is strongly recommended.', cta: 'Book your appointment' },
  MODERATE: { headline: '👁️ Stay monitored', body: 'Your risk is moderate. Regular monitoring and lifestyle changes now can prevent progression. Stay on track with your care plan.', cta: 'Review at your next visit' },
  LOW:      { headline: '✅ Keep it up', body: 'Your risk is currently low. Continue healthy habits and attend annual screenings to stay ahead of any changes.', cta: 'Annual check-up recommended' },
}

const tierColor = {
  URGENT: '#DC2626', HIGH: '#EA580C', MODERATE: '#CA8A04', LOW: '#16A34A',
}
const tierBg = {
  URGENT: '#FEF2F2', HIGH: '#FFF7ED', MODERATE: '#FEFCE8', LOW: '#F0FDF4',
}

export default function PatientPortal() {
  const [pt, setPt]       = useState(null)
  const [tab, setTab]     = useState('overview')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/patient/me')
      .then(r => setPt(r.data))
      .catch(() => setError('Failed to load your health record. Please sign in again.'))
  }, [])

  if (error) return <Layout title="My Kidney Health"><p className="text-red-500">{error}</p></Layout>
  if (!pt)   return <Layout title="My Kidney Health"><p className="text-gray-400">Loading your record…</p></Layout>

  const color   = tierColor[pt.urgency_tier] ?? '#14B8A6'
  const bg      = tierBg[pt.urgency_tier]    ?? '#f0fdfa'
  const msg     = TIMELINE_MSG[pt.urgency_tier]
  const actions = ACTIONS[pt.urgency_tier] ?? ACTIONS.LOW
  const riskPct = Math.round(pt.risk_score * 100)

  return (
    <Layout title="My Kidney Health Summary" subtitle="Your personal risk summary · Bring questions to your next visit">

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 text-amber-800 text-sm">
        This page shows <strong>educational risk information only</strong> — not a medical diagnosis.
        For urgent symptoms (swelling, shortness of breath, severe pain), call 911 or go to Emergency.
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['overview','📊 Overview'], ['actions','✅ My Action List'], ['learn','📚 Learn & Ask']].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === k ? 'bg-teal-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk dial */}
          <div className="card flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Modelled Risk Index</p>
            <div
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-8 mb-4"
              style={{ borderColor: color, background: bg }}
            >
              <span className="text-4xl font-black font-mono" style={{ color }}>{riskPct}%</span>
            </div>
            <TierBadge tier={pt.urgency_tier} />
            <p className="text-xs text-gray-400 mt-2">Based on registry score · not a lab result</p>
            {pt.pathway && <p className="text-xs text-gray-500 mt-1">Care pathway: <strong>{pt.pathway}</strong></p>}
          </div>

          {/* Message + timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border p-5" style={{ background: bg, borderColor: color + '33' }}>
              <p className="font-bold text-base mb-2" style={{ color }}>{msg.headline}</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{msg.body}</p>
              <p className="font-semibold text-sm" style={{ color }}>{msg.cta}</p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Estimated Timeline</p>
              <p className="text-3xl font-bold font-mono" style={{ color }}>{pt.est_months}</p>
              <p className="text-xs text-gray-400 mt-1">
                If nothing changes clinically, the model suggests kidney disease could develop in about
                <strong> {pt.est_months}</strong>. Your team will interpret this with your lab results.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'actions' && (
        <div className="max-w-2xl space-y-4">
          <h2 className="font-semibold text-gray-900">Your Next Steps</h2>
          {actions.map(([icon, text], i) => (
            <div key={i} className="card flex items-start gap-4 py-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-lg shrink-0">{icon}</div>
              <div>
                <p className="text-xs font-bold text-teal-600 mb-0.5">Step {i + 1}</p>
                <p className="text-sm text-gray-800">{text}</p>
              </div>
            </div>
          ))}

          {/* Cost awareness */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold text-orange-600">If CKD develops untreated</p>
              <p className="text-2xl font-black text-orange-600 mt-1">$28,162</p>
              <p className="text-xs text-orange-500">per year in healthcare costs</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold text-green-600">With early intervention</p>
              <p className="text-2xl font-black text-green-600 mt-1">$13,604</p>
              <p className="text-xs text-green-500">potential saving of $14,558/yr</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">Source: USRDS 2023</p>
        </div>
      )}

      {tab === 'learn' && (
        <div className="max-w-2xl space-y-3">
          {[
            {
              q: '🫘 What is CKD Stage 3?',
              a: 'Chronic Kidney Disease Stage 3 means your kidneys are working at 30–59% of normal capacity (eGFR 30–59). At this stage, most people have no symptoms — which is why early detection is so important. Reference: KDIGO 2024',
            },
            {
              q: '📊 What does my risk score mean?',
              a: '0–40% LOW — Continue regular monitoring\n40–65% MODERATE — Discuss with your doctor\n65–85% HIGH — Schedule appointment soon\n85–100% URGENT — Contact your doctor today\n\nReference: KDIGO 2024 · Tangri et al. 2016',
            },
            {
              q: '💊 What can slow CKD progression?',
              a: '• Blood pressure control below 130/80 mmHg\n• HbA1c below 7% (if diabetic)\n• ACE inhibitors or ARB medications\n• SGLT2 inhibitors (if diabetic or UACR ≥ 200)\n• Low-sodium diet (under 2g/day)\n• Regular moderate exercise\n\nReference: KDIGO 2024 · ADA 2023',
            },
            {
              q: '📞 Who should I contact?',
              a: '• Urgent symptoms (swelling, difficulty breathing, sudden pain): Call 911 or go to Emergency\n• Risk questions: Call your primary care physician\n• Specialist care: Ask for a nephrology referral\n• This tool: Discuss results at your next visit',
            },
          ].map(({ q, a }) => (
            <details key={q} className="card cursor-pointer group">
              <summary className="font-medium text-gray-800 list-none flex justify-between items-center">
                {q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg">›</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{a}</p>
            </details>
          ))}
        </div>
      )}
    </Layout>
  )
}
