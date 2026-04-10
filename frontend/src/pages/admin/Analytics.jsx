import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend, LineChart, Line
} from 'recharts'
import Sidebar from '../../components/Sidebar'
import api from '../../api/client'

const TIER_COLORS = { URGENT: '#DC2626', HIGH: '#EA580C', MODERATE: '#CA8A04', LOW: '#16A34A' }

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
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/registry/', { params: { limit: 500 } })
      .then(r => setPatients(r.data.patients))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50"><Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📊</div><p className="text-gray-400">Loading analytics…</p></div>
      </div>
    </div>
  )

  // Risk score histogram (buckets of 10%)
  const histBuckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${(i + 1) * 10}%`,
    count: patients.filter(p => p.risk_score * 100 >= i * 10 && p.risk_score * 100 < (i + 1) * 10).length,
    fill: i >= 8 ? '#DC2626' : i >= 6 ? '#EA580C' : i >= 4 ? '#CA8A04' : '#14B8A6',
  }))

  // Gender breakdown
  const genderMap = {}
  patients.forEach(p => { if (p.gender) genderMap[p.gender] = (genderMap[p.gender] || 0) + 1 })
  const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value }))
  const genderColors = ['#14B8A6', '#6366F1', '#F59E0B', '#EC4899']

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

  // Tier by gender
  const tgData = ['Male', 'Female'].map(g => ({
    gender: g,
    URGENT:   patients.filter(p => p.gender === g && p.urgency_tier === 'URGENT').length,
    HIGH:     patients.filter(p => p.gender === g && p.urgency_tier === 'HIGH').length,
    MODERATE: patients.filter(p => p.gender === g && p.urgency_tier === 'MODERATE').length,
    LOW:      patients.filter(p => p.gender === g && p.urgency_tier === 'LOW').length,
  }))

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
          <p className="text-xs text-gray-400 mt-0.5">Population risk breakdown · {patients.length.toLocaleString()} patients loaded</p>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-5">
            {/* Risk score histogram */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Risk Score Distribution</p>
              <p className="text-xs text-gray-400 mb-4">Number of patients per risk decile</p>
              <ResponsiveContainer width="100%" height={200}>
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
            </div>

            {/* Gender donut */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Gender Distribution</p>
              <p className="text-xs text-gray-400 mb-4">Patients by gender across all tiers</p>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {genderData.map((_, i) => <Cell key={i} fill={genderColors[i % genderColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v.toLocaleString(), 'Patients']} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 flex-1">
                  {genderData.map(({ name, value }, i) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: genderColors[i] }} />
                        <span className="text-gray-600">{name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-800">{value.toLocaleString()}</span>
                        <span className="text-gray-400 ml-1">({((value / patients.length) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-5">
            {/* Tier by gender stacked */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Risk Tier by Gender</p>
              <p className="text-xs text-gray-400 mb-4">Distribution of urgency tiers across genders</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tgData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="gender" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {['URGENT','HIGH','MODERATE','LOW'].map(t => (
                    <Bar key={t} dataKey={t} stackId="a" fill={TIER_COLORS[t]} radius={t === 'LOW' ? [4,4,0,0] : [0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg risk by age group */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-800 mb-1">Average Risk by Age Group</p>
              <p className="text-xs text-gray-400 mb-4">Mean risk score per age cohort</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ageRiskData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(v, n) => [n === 'avgRisk' ? `${v}%` : v.toLocaleString(), n === 'avgRisk' ? 'Avg Risk' : 'Patients']} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="avgRisk" name="avgRisk" fill="#14B8A6" radius={[6,6,0,0]} />
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

          <p className="text-xs text-gray-300 text-center">
            Analytics based on Synthea synthetic EHR data · Not for clinical decisions · KDIGO 2024
          </p>
        </main>
      </div>
    </div>
  )
}
