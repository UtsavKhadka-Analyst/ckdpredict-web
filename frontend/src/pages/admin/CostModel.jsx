import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import Sidebar from '../../components/Sidebar'
import api from '../../api/client'

const BENCHMARKS = [
  { label: 'No CKD',       cost: 13604,  color: '#16A34A', desc: 'Baseline Medicare beneficiary' },
  { label: 'CKD Stage 3',  cost: 28162,  color: '#EA580C', desc: 'Diagnosed CKD Stage 3' },
  { label: 'CKD Stage 4',  cost: 53000,  color: '#DC2626', desc: 'Advanced CKD' },
  { label: 'ESKD (dialysis)', cost: 104000, color: '#7C3AED', desc: 'End-stage kidney disease' },
]

export default function CostModel() {
  const [stats, setStats]       = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [intervention, setIntervention] = useState(30) // % of high-risk reached

  useEffect(() => {
    Promise.all([
      api.get('/registry/stats'),
      api.get('/registry/', { params: { limit: 500 } }),
    ]).then(([s, p]) => {
      setStats(s.data)
      setPatients(p.data.patients)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50"><Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading cost model…</p>
      </div>
    </div>
  )

  const urgentHigh = patients.filter(p => ['URGENT','HIGH'].includes(p.urgency_tier))
  const reached    = Math.round(urgentHigh.length * intervention / 100)
  const savingPer  = 28162 - 13604
  const totalSaving = reached * savingPer
  const totalProj  = stats?.total_proj_cost ?? 0
  const roi        = totalSaving > 0 ? ((totalSaving / (reached * 500)) * 100).toFixed(0) : 0 // assume $500 intervention cost/pt

  const barData = BENCHMARKS.map(b => ({ ...b, name: b.label }))

  const tierCostData = [
    { tier: 'URGENT',   avg: 85000, patients: stats?.urgent ?? 0 },
    { tier: 'HIGH',     avg: 55000, patients: stats?.high ?? 0 },
    { tier: 'MODERATE', avg: 28162, patients: stats?.moderate ?? 0 },
    { tier: 'LOW',      avg: 13604, patients: stats?.low ?? 0 },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-base font-bold text-gray-900">Cost Model</h1>
          <p className="text-xs text-gray-400 mt-0.5">Medicare cost projections · USRDS 2023 benchmarks</p>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* USRDS Benchmarks */}
          <div className="grid grid-cols-4 gap-3">
            {BENCHMARKS.map(({ label, cost, color, desc }) => (
              <div key={label} className="card border-t-4" style={{ borderTopColor: color }}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-black mt-1" style={{ color }}>${cost.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                <p className="text-xs text-gray-300 mt-1">per patient / year</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Benchmark chart */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Annual Cost by CKD Stage</p>
              <p className="text-xs text-gray-400 mb-4">Medicare per-patient annual cost · USRDS 2023</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`$${Number(v).toLocaleString()}`, 'Annual cost']} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="cost" name="Annual Cost" radius={[6,6,0,0]}>
                    {barData.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg cost by tier */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Estimated Cost by Risk Tier</p>
              <p className="text-xs text-gray-400 mb-4">Projected annual cost per tier · registry population</p>
              <div className="space-y-3">
                {tierCostData.map(({ tier, avg, patients: n }) => {
                  const colors = { URGENT: '#DC2626', HIGH: '#EA580C', MODERATE: '#CA8A04', LOW: '#16A34A' }
                  const total  = avg * n
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <div className="w-20 text-xs font-semibold" style={{ color: colors[tier] }}>{tier}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center px-2 transition-all duration-500"
                          style={{
                            width: `${Math.min((avg / 104000) * 100, 100)}%`,
                            background: colors[tier]
                          }}
                        >
                          <span className="text-white text-xs font-semibold whitespace-nowrap">
                            ${avg.toLocaleString()}/pt
                          </span>
                        </div>
                      </div>
                      <div className="text-right w-28">
                        <p className="text-xs font-bold text-gray-700">${(total/1e6).toFixed(1)}M</p>
                        <p className="text-xs text-gray-400">{n.toLocaleString()} pts</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Interactive savings calculator */}
          <div className="card border border-teal-100 bg-teal-50/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800">💡 Intervention Savings Calculator</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Estimate savings if you reach a portion of URGENT + HIGH patients with early intervention
                </p>
              </div>
              <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2.5 py-1 rounded-full">
                KDIGO 2024
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 items-center">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  % of URGENT + HIGH patients reached
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={5} max={100} step={5}
                    value={intervention}
                    onChange={e => setIntervention(Number(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="text-lg font-black text-teal-600 w-12 text-right">{intervention}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {reached.toLocaleString()} of {urgentHigh.length.toLocaleString()} patients
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Patients reached</p>
                  <p className="text-xl font-black text-gray-800">{reached.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-green-600 font-semibold">Projected saving</p>
                  <p className="text-xl font-black text-green-600">${(totalSaving/1e6).toFixed(2)}M</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-1">Saving per patient</p>
                <p className="text-3xl font-black text-teal-600">${savingPer.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">CKD Stage 3 vs no CKD</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Est. ROI (at $500/pt cost)</p>
                  <p className="text-xl font-black text-purple-600">{roi}%</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-300 text-center">
            Cost benchmarks: USRDS Annual Data Report 2023 · Synthea synthetic patient data · Not for financial planning
          </p>
        </main>
      </div>
    </div>
  )
}
