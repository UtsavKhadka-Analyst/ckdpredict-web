import { useEffect, useState } from 'react'
import { Search, ChevronRight, Stethoscope, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TierBadge from '../components/TierBadge'
import api from '../api/client'

const TIER_COLOR = { URGENT:'#DC2626', HIGH:'#EA580C', MODERATE:'#CA8A04', LOW:'#16A34A' }
const TIER_BG    = { URGENT:'#FEF2F2', HIGH:'#FFF7ED', MODERATE:'#FEFCE8', LOW:'#F0FDF4' }

const CHECKLIST = {
  URGENT: [
    { icon:'📞', text:'Contact patient within 24–48 hours', ref:'' },
    { icon:'💊', text:'Consider SGLT2 inhibitor (diabetic or UACR ≥ 200 mg/g)', ref:'KDIGO 2024 · DAPA-CKD · EMPA-KIDNEY' },
    { icon:'💊', text:'Consider finerenone (diabetic CKD with albuminuria)', ref:'KDIGO 2024 · FIDELIO-DKD · FIGARO-DKD' },
    { icon:'🩺', text:'Order eGFR + UACR + comprehensive metabolic panel', ref:'' },
    { icon:'📋', text:'Refer to nephrology if eGFR < 30 ml/min/1.73m²', ref:'KDIGO 2024' },
    { icon:'💉', text:'Assess for anaemia — CBC, iron studies', ref:'' },
  ],
  HIGH: [
    { icon:'📅', text:'Schedule appointment within 2 weeks', ref:'' },
    { icon:'💊', text:'Review ACE inhibitor / ARB therapy', ref:'KDIGO 2024' },
    { icon:'🩺', text:'Repeat eGFR and UACR in 3 months', ref:'' },
    { icon:'📊', text:'Assess CVD risk — lipids, HbA1c, blood pressure', ref:'ADA 2023' },
    { icon:'🥗', text:'Dietary referral — low sodium, low protein', ref:'' },
  ],
  MODERATE: [
    { icon:'📅', text:'Routine follow-up in 3–6 months', ref:'' },
    { icon:'🥗', text:'Low-sodium diet counselling (< 2g/day)', ref:'KDIGO 2024' },
    { icon:'🏃', text:'Lifestyle intervention — exercise + BP control < 130/80', ref:'ADA 2023' },
    { icon:'📊', text:'Annual eGFR + UACR monitoring', ref:'' },
    { icon:'💊', text:'Optimise blood pressure medication if needed', ref:'' },
  ],
  LOW: [
    { icon:'📅', text:'Annual screening visit', ref:'' },
    { icon:'🥗', text:'Diet and lifestyle education', ref:'' },
    { icon:'📊', text:'BP target < 130/80 mmHg', ref:'KDIGO 2024' },
    { icon:'🩺', text:'Routine metabolic panel', ref:'' },
  ],
}

export default function NephDashboard() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [tierFilter, setTier]   = useState('')
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('overview')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/registry/', { params: { limit: 500 } })
      .then(r => { setPatients(r.data.patients); setSelected(r.data.patients[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  const visible = patients
    .filter(p => !tierFilter || p.urgency_tier === tierFilter)
    .filter(p => !search || p.patient_id.toLowerCase().includes(search.toLowerCase()))

  const pt = selected
  const color  = pt ? TIER_COLOR[pt.urgency_tier] : '#14B8A6'
  const bg     = pt ? TIER_BG[pt.urgency_tier] : '#f0fdfa'
  const riskPct = pt ? Math.round(pt.risk_score * 100) : 0

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-base font-bold text-gray-900">Individual Patient Record</h1>
          <p className="text-xs text-gray-400 mt-0.5">Nephrologist view · KDIGO 2024 clinical decision support</p>
        </header>

        <main className="flex-1 flex min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
          {/* Patient list sidebar */}
          <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col">
            {/* Filters */}
            <div className="p-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-8 py-1.5 text-xs w-full"
                  placeholder="Search patient ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {['','URGENT','HIGH','MODERATE','LOW'].map(t => (
                  <button
                    key={t || 'all'}
                    onClick={() => setTier(t)}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${
                      tierFilter === t
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t || 'All'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">{visible.length.toLocaleString()} patients</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                Array.from({length:8}).map((_,i) => (
                  <div key={i} className="px-4 py-3 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-32 mb-2" />
                    <div className="h-2 bg-gray-100 rounded w-20" />
                  </div>
                ))
              ) : visible.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No patients match</div>
              ) : visible.map(p => (
                <button
                  key={p.patient_id}
                  onClick={() => { setSelected(p); setTab('overview') }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2
                    ${selected?.patient_id === p.patient_id ? 'bg-teal-50 border-l-2 border-teal-500' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-gray-500 truncate">{p.patient_id.slice(0,12)}…</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TierBadge tier={p.urgency_tier} />
                      <span className="text-xs font-mono text-gray-600 font-semibold">
                        {(p.risk_score*100).toFixed(0)}%
                      </span>
                    </div>
                    {p.city && <p className="text-xs text-gray-400 mt-0.5">{p.city}</p>}
                  </div>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {!pt ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Stethoscope size={40} className="mb-3 opacity-30" />
                <p>Select a patient from the list</p>
              </div>
            ) : (
              <>
                {/* Patient header card */}
                <div className="card mb-5 border-l-4" style={{ borderLeftColor: color }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs text-gray-400 mb-1">{pt.patient_id}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <TierBadge tier={pt.urgency_tier} />
                        <span className="text-3xl font-black font-mono" style={{ color }}>{riskPct}%</span>
                        <span className="text-sm text-gray-400">risk index</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                        {pt.age    && <span>Age {pt.age}</span>}
                        {pt.gender && <span>· {pt.gender}</span>}
                        {pt.city   && <span>· {pt.city}</span>}
                        {pt.pathway && <span>· Pathway: <strong>{pt.pathway}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Estimated timeline</p>
                      <p className="text-2xl font-bold" style={{ color }}>{pt.est_months}</p>
                      {pt.proj_cost && (
                        <p className="text-xs text-gray-400 mt-1">Proj. cost: <strong>${Number(pt.proj_cost).toLocaleString()}/yr</strong></p>
                      )}
                    </div>
                  </div>

                  {/* Risk bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Risk Score</span>
                      <span className="font-semibold" style={{ color }}>{riskPct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${riskPct}%`, background: color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 mt-1">
                      <span>LOW ≥ 0%</span><span>MODERATE ≥ 40%</span><span>HIGH ≥ 65%</span><span>URGENT ≥ 85%</span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5 border-b border-gray-100 pb-0">
                  {[['overview','📊 Overview'],['checklist','✅ Clinical Checklist'],['costs','💰 Cost View']].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                        tab === k
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Overview */}
                {tab === 'overview' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Patient Summary</p>
                      <div className="space-y-3">
                        {[
                          ['Risk Score',    `${riskPct}%`],
                          ['Urgency Tier',  pt.urgency_tier],
                          ['Est. Timeline', pt.est_months],
                          ['Age',           pt.age ?? '—'],
                          ['Gender',        pt.gender ?? '—'],
                          ['City',          pt.city ?? '—'],
                          ['Care Pathway',  pt.pathway ?? 'Standard'],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-gray-500 text-xs">{label}</span>
                            <span className="font-semibold text-gray-800 text-xs">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card" style={{ background: bg, borderColor: color + '33' }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color }}>
                        Clinical Summary
                      </p>
                      <p className="text-sm font-bold mb-2" style={{ color }}>
                        {pt.urgency_tier === 'URGENT' ? '⚠️ Immediate action required'
                          : pt.urgency_tier === 'HIGH' ? '📅 Timely follow-up needed'
                          : pt.urgency_tier === 'MODERATE' ? '👁️ Monitor and manage'
                          : '✅ Routine monitoring'}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {pt.urgency_tier === 'URGENT'
                          ? 'This patient has the highest risk score and requires immediate clinical review. Consider urgent nephrology referral and medication optimization.'
                          : pt.urgency_tier === 'HIGH'
                          ? 'Elevated risk warrants a scheduled follow-up within 2 weeks. Review current medications and order kidney function tests.'
                          : pt.urgency_tier === 'MODERATE'
                          ? 'Moderate risk. Lifestyle interventions and routine monitoring are the primary recommendations at this stage.'
                          : 'Low risk. Annual screening and patient education are appropriate. Continue current care plan.'}
                      </p>
                      <div className="mt-4 pt-3 border-t border-current/10 text-xs text-gray-400">
                        Reference: KDIGO 2024 Clinical Practice Guideline
                      </div>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {tab === 'checklist' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-blue-500" />
                      <p className="text-xs text-blue-600 font-medium">
                        Clinical decision support only — does not replace clinical judgment · KDIGO 2024
                      </p>
                    </div>
                    {(CHECKLIST[pt.urgency_tier] ?? CHECKLIST.LOW).map(({ icon, text, ref }, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-xl shrink-0">{icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 font-medium">{text}</p>
                          {ref && <p className="text-xs text-teal-600 mt-1 font-medium">{ref}</p>}
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0 mt-0.5 hover:border-teal-400 cursor-pointer transition-colors" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Costs */}
                {tab === 'costs' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Medicare Benchmarks</p>
                      <div className="space-y-3">
                        {[
                          ['No CKD baseline', '$13,604', '#16A34A'],
                          ['CKD Stage 3',     '$28,162', '#EA580C'],
                          ['ESKD (dialysis)', '$104,000+', '#DC2626'],
                          ['This patient',    pt.proj_cost ? `$${Number(pt.proj_cost).toLocaleString()}` : '—', color],
                        ].map(([label, val, c]) => (
                          <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-600">{label}</span>
                            <span className="text-sm font-black" style={{ color: c }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-300 mt-3">Source: USRDS Annual Data Report 2023</p>
                    </div>
                    <div className="card" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">Potential Saving</p>
                      <p className="text-4xl font-black text-green-600">$14,558</p>
                      <p className="text-xs text-green-600 mt-1">per year with early intervention</p>
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        Early detection and treatment of CKD Stage 3 can prevent progression to ESKD,
                        reducing annual Medicare costs by up to $75,000+ per patient.
                      </p>
                      <div className="mt-4 pt-3 border-t border-green-100 text-xs text-gray-400">
                        Reference: USRDS 2023 · KDIGO 2024
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
