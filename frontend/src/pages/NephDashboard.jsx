import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import TierBadge from '../components/TierBadge'
import api from '../api/client'

const CHECKLIST = {
  URGENT: [
    { icon: '📞', text: 'Contact patient within 24–48 hours' },
    { icon: '💊', text: 'Consider SGLT2 inhibitor (diabetic or UACR ≥ 200 mg/g)', ref: 'KDIGO 2024 / DAPA-CKD / EMPA-KIDNEY' },
    { icon: '💊', text: 'Consider finerenone (diabetic CKD with albuminuria)', ref: 'KDIGO 2024 / FIDELIO-DKD / FIGARO-DKD' },
    { icon: '🩺', text: 'Order eGFR + UACR + metabolic panel' },
    { icon: '📋', text: 'Refer to nephrology if eGFR < 30' },
  ],
  HIGH: [
    { icon: '📅', text: 'Schedule appointment within 2 weeks' },
    { icon: '💊', text: 'Review ACE inhibitor / ARB therapy' },
    { icon: '🩺', text: 'Repeat eGFR and UACR in 3 months' },
    { icon: '📊', text: 'Assess CVD risk — lipids, HbA1c, BP' },
  ],
  MODERATE: [
    { icon: '📅', text: 'Routine follow-up in 3–6 months' },
    { icon: '🥗', text: 'Low-sodium diet counselling (< 2g/day)' },
    { icon: '🏃', text: 'Lifestyle intervention — exercise + BP control' },
    { icon: '📊', text: 'Annual eGFR + UACR monitoring' },
  ],
  LOW: [
    { icon: '📅', text: 'Annual screening visit' },
    { icon: '🥗', text: 'Diet and lifestyle education' },
    { icon: '📊', text: 'BP target < 130/80 mmHg' },
  ],
}

export default function NephDashboard() {
  const [patients, setPatients]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [tier, setTier]           = useState('')
  const [tab, setTab]             = useState('overview')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get('/registry/', { params: { limit: 200, tier: tier || undefined } })
      .then(r => {
        setPatients(r.data.patients)
        setSelected(r.data.patients[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [tier])

  const pt = selected

  const tierColor = {
    URGENT: 'text-red-600', HIGH: 'text-orange-600',
    MODERATE: 'text-yellow-600', LOW: 'text-green-600',
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-base font-bold text-gray-900">Individual Patient Record</h1>
          <p className="text-xs text-gray-400 mt-0.5">Nephrologist view — KDIGO 2024 clinical decision support</p>
        </header>
        <main className="flex-1 p-6">
      {loading ? <p className="text-gray-400">Loading…</p> : (
        <div className="flex gap-6">
          {/* Sidebar list */}
          <div className="w-64 shrink-0">
            <div className="card p-0 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <select
                  className="input text-xs py-1.5"
                  value={tier}
                  onChange={e => setTier(e.target.value)}
                >
                  <option value="">All tiers</option>
                  {['URGENT','HIGH','MODERATE','LOW'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
                {patients.map(p => (
                  <button
                    key={p.patient_id}
                    onClick={() => { setSelected(p); setTab('overview') }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.patient_id === p.patient_id ? 'bg-teal-50' : ''}`}
                  >
                    <p className="font-mono text-xs text-gray-500">{p.patient_id.slice(0,8)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <TierBadge tier={p.urgency_tier} />
                      <span className="text-xs font-mono text-gray-600">{(p.risk_score*100).toFixed(0)}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          {pt ? (
            <div className="flex-1">
              {/* Patient header */}
              <div className="card mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm text-gray-400">{pt.patient_id}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <TierBadge tier={pt.urgency_tier} />
                      <span className={`text-2xl font-bold font-mono ${tierColor[pt.urgency_tier]}`}>
                        {(pt.risk_score * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-400">risk index</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {pt.age && `Age ${pt.age}`}{pt.gender && ` · ${pt.gender}`}
                      {pt.city && ` · ${pt.city}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Estimated timeline</p>
                    <p className={`text-lg font-bold ${tierColor[pt.urgency_tier]}`}>{pt.est_months}</p>
                    {pt.proj_cost && (
                      <p className="text-xs text-gray-400 mt-1">Proj. cost: ${pt.proj_cost.toLocaleString()}/yr</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {['overview', 'checklist'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      tab === t ? 'bg-teal-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'overview' ? '📊 Overview' : '✅ Clinical Checklist'}
                  </button>
                ))}
              </div>

              {tab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Risk Breakdown</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Ensemble Score', val: pt.risk_score },
                        { label: 'Urgency Tier',   val: pt.urgency_tier, isText: true },
                        { label: 'Est. Timeline',  val: pt.est_months, isText: true },
                        { label: 'Care Pathway',   val: pt.pathway ?? 'Standard', isText: true },
                      ].map(({ label, val, isText }) => (
                        <div key={label} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-semibold text-gray-900">
                            {isText ? val : `${(val*100).toFixed(1)}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cost Projection</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'No CKD (baseline)',    val: '$13,604/yr', color: 'text-green-600' },
                        { label: 'CKD Stage 3',          val: '$28,162/yr', color: 'text-orange-600' },
                        { label: 'ESKD',                 val: '$104,000+/yr', color: 'text-red-600' },
                        { label: 'Patient projection',   val: pt.proj_cost ? `$${pt.proj_cost.toLocaleString()}/yr` : '—', color: 'text-gray-900' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-semibold ${color}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-300 mt-3">Source: USRDS 2023</p>
                  </div>
                </div>
              )}

              {tab === 'checklist' && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Clinical Action Checklist
                    <span className="ml-2 text-xs font-normal text-gray-400">KDIGO 2024</span>
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Decision support only — does not replace clinical judgment.
                  </p>
                  <div className="space-y-3">
                    {(CHECKLIST[pt.urgency_tier] ?? CHECKLIST.LOW).map(({ icon, text, ref }, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-lg shrink-0">{icon}</span>
                        <div>
                          <p className="text-sm text-gray-800">{text}</p>
                          {ref && <p className="text-xs text-teal-600 mt-0.5">{ref}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    🔵 <strong>Clinical decision support only</strong> — model trained on Synthea synthetic EHR data
                    (Walonoski et al., 2018). Not validated on real patient populations.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 card flex items-center justify-center text-gray-400">
              Select a patient from the list
            </div>
          )}
        </div>
      )}
        </main>
      </div>
    </div>
  )
}
