import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import Sidebar from '../../components/Sidebar'
import { useRegistry } from '../../context/RegistryContext'

const TIER_COLORS  = { URGENT: '#DC2626', HIGH: '#EA580C', MODERATE: '#CA8A04', LOW: '#16A34A' }
const TIER_INTERP  = {
  URGENT:   'Contact within 24–48 hours',
  HIGH:     'Schedule within 2 weeks',
  MODERATE: 'Routine follow-up 3–6 months',
  LOW:      'Annual screening',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value?.toLocaleString()}</strong></p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { patients, loading } = useRegistry()

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50"><Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📊</div><p className="text-gray-400">Loading analytics…</p></div>
      </div>
    </div>
  )

  const total = patients.length

  // Tier distribution — horizontal bar for easy comparison
  const tierData = ['URGENT','HIGH','MODERATE','LOW'].map(tier => {
    const count = patients.filter(p => p.urgency_tier === tier).length
    return {
      tier,
      count,
      pct: ((count / total) * 100).toFixed(1),
      action: TIER_INTERP[tier],
    }
  })

  // Risk score histogram (buckets of 10%)
  const histBuckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${(i + 1) * 10}%`,
    count: patients.filter(p => p.risk_score * 100 >= i * 10 && p.risk_score * 100 < (i + 1) * 10).length,
    fill: i >= 8 ? '#DC2626' : i >= 6 ? '#EA580C' : i >= 4 ? '#CA8A04' : '#14B8A6',
  }))

  // Age group distribution
  const ageGroups = { '18–40': 0, '41–60': 0, '61–75': 0, '75+': 0 }
  patients.forEach(p => {
    const a = Number(p.age)
    if (a >= 18 && a <= 40) ageGroups['18–40']++
    else if (a <= 60) ageGroups['41–60']++
    else if (a <= 75) ageGroups['61–75']++
    else if (a > 75) ageGroups['75+']++
  })
  const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }))

  // Tier by gender — CSV stores 'M' / 'F'
  const tgData = [{ key: 'M', label: 'Male' }, { key: 'F', label: 'Female' }].map(({ key, label }) => ({
    gender: label,
    URGENT:   patients.filter(p => p.gender === key && p.urgency_tier === 'URGENT').length,
    HIGH:     patients.filter(p => p.gender === key && p.urgency_tier === 'HIGH').length,
    MODERATE: patients.filter(p => p.gender === key && p.urgency_tier === 'MODERATE').length,
    LOW:      patients.filter(p => p.gender === key && p.urgency_tier === 'LOW').length,
  }))

  // State distribution
  const stateMap = {}
  patients.forEach(p => {
    const st = p.state || 'Unknown'
    if (!stateMap[st]) stateMap[st] = { state: st, URGENT: 0, HIGH: 0, MODERATE: 0, LOW: 0, total: 0, totalCost: 0 }
    stateMap[st][p.urgency_tier] = (stateMap[st][p.urgency_tier] || 0) + 1
    stateMap[st].total++
    stateMap[st].totalCost += p.proj_cost ?? 0
  })
  const stateData = Object.values(stateMap).sort((a, b) => b.total - a.total)
  const STATE_COLORS = ['#0D9488', '#1B3A6B', '#7C3AED', '#B45309', '#065F46']

  // Avg risk by age group
  const ageRiskData = ageData.map(({ name }) => {
    const sub = patients.filter(p => {
      const a = Number(p.age)
      if (name === '18–40') return a >= 18 && a <= 40
      if (name === '41–60') return a >= 41 && a <= 60
      if (name === '61–75') return a >= 61 && a <= 75
      return a > 75
    })
    const avg = sub.length ? sub.reduce((s, p) => s + p.risk_score, 0) / sub.length : 0
    return { name, avgRisk: Math.round(avg * 100), count: sub.length }
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-base font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Population risk breakdown · {total.toLocaleString()} patients loaded</p>
        </header>

        <main className="flex-1 p-6 space-y-6">

          {/* Row 1 — Tier distribution + Risk histogram */}
          <div className="grid grid-cols-2 gap-5">

            {/* Tier distribution — horizontal bar (easy to compare) */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Patient Distribution by Urgency Tier</p>
              <p className="text-xs text-gray-400 mb-4">
                How many patients fall into each clinical priority group
              </p>
              <div className="space-y-3">
                {tierData.map(({ tier, count, pct, action }) => (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLORS[tier] }} />
                        <span className="text-xs font-semibold text-gray-700">{tier}</span>
                        <span className="text-xs text-gray-400">— {action}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-800">{count.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: TIER_COLORS[tier] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
                ⚠ <strong>{tierData[0].count.toLocaleString()} URGENT</strong> patients require immediate contact within 24–48 hours
              </p>
            </div>

            {/* Risk score histogram */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Risk Score Distribution</p>
              <p className="text-xs text-gray-400 mb-4">
                Most patients score below 40% (LOW risk). Red bars = URGENT zone (≥ 85%).
              </p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={histBuckets} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Patients" radius={[4,4,0,0]}>
                    {histBuckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2">
                Teal = LOW · Yellow = MODERATE · Orange = HIGH · Red = URGENT
              </p>
            </div>
          </div>

          {/* Row 2 — Tier by gender + Avg risk by age */}
          <div className="grid grid-cols-2 gap-5">

            {/* Tier by gender stacked bar */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Risk Tier by Gender</p>
              <p className="text-xs text-gray-400 mb-4">
                Urgency tier breakdown for male vs female patients — distribution is broadly similar across genders.
              </p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={tgData} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="gender" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {['URGENT','HIGH','MODERATE','LOW'].map(t => (
                    <Bar key={t} dataKey={t} stackId="a" fill={TIER_COLORS[t]}
                      radius={t === 'LOW' ? [4,4,0,0] : [0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg risk by age group */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Average Risk Score by Age Group</p>
              <p className="text-xs text-gray-400 mb-4">
                Older patients carry significantly higher CKD progression risk — patients 75+ average {ageRiskData.find(a => a.name === '75+')?.avgRisk}% risk.
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ageRiskData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(v, n) => [n === 'avgRisk' ? `${v}%` : v.toLocaleString(), n === 'avgRisk' ? 'Avg Risk' : 'Patients']} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="avgRisk" name="Avg Risk Score" fill="#14B8A6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {ageRiskData.map(({ name, count, avgRisk }) => (
                  <div key={name} className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-teal-600">{avgRisk}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">{name}</p>
                    <p className="text-xs text-gray-400">{count.toLocaleString()} pts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3 — State distribution */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-800 mb-1">Patient Distribution by State</p>
            <p className="text-xs text-gray-400 mb-4">
              Urgency tier breakdown across all registry states
            </p>
            <div className="grid grid-cols-1 gap-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={stateData} layout="vertical" barSize={30} margin={{ left: 90, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="state"
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                    axisLine={false} tickLine={false} width={85}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {['URGENT','HIGH','MODERATE','LOW'].map(t => (
                    <Bar key={t} dataKey={t} stackId="a" fill={TIER_COLORS[t]}
                      radius={t === 'LOW' ? [0,4,4,0] : [0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stateData.length}, 1fr)` }}>
                {stateData.map((s, i) => (
                  <div key={s.state} className="p-3 bg-gray-50 rounded-xl border-l-4" style={{ borderColor: STATE_COLORS[i] }}>
                    <p className="text-xs font-bold text-gray-800">{s.state}</p>
                    <p className="text-lg font-black text-gray-900 mt-1">{s.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">patients</p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs"><span className="font-semibold text-red-600">{s.URGENT.toLocaleString()}</span> <span className="text-gray-400">URGENT</span></p>
                      <p className="text-xs"><span className="font-semibold text-orange-600">{s.HIGH.toLocaleString()}</span> <span className="text-gray-400">HIGH</span></p>
                      <p className="text-xs"><span className="font-semibold text-yellow-600">{s.MODERATE.toLocaleString()}</span> <span className="text-gray-400">MODERATE</span></p>
                      <p className="text-xs"><span className="font-semibold text-green-600">{s.LOW.toLocaleString()}</span> <span className="text-gray-400">LOW</span></p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">${(s.totalCost / 1e6).toFixed(1)}M proj. cost</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-300 text-center">
            Analytics based on Synthea synthetic EHR data · Not for clinical decisions · KDIGO 2024
          </p>
        </main>
      </div>
    </div>
  )
}
