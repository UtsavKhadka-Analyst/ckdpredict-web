import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import Sidebar from '../../components/Sidebar'
import TierBadge from '../../components/TierBadge'
import { useRegistry } from '../../context/RegistryContext'

const TIER_COLORS = { URGENT: '#DC2626', HIGH: '#EA580C', MODERATE: '#CA8A04', LOW: '#16A34A' }



export default function Geographic() {
  const { patients, loading } = useRegistry()
  const [sortBy, setSortBy]   = useState('urgent')

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50"><Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading geographic data…</p>
      </div>
    </div>
  )

  // Aggregate by state
  const stateMap = {}
  patients.forEach(p => {
    const state = p.state || 'Unknown'
    if (!stateMap[state]) stateMap[state] = { state, URGENT: 0, HIGH: 0, MODERATE: 0, LOW: 0, total: 0, totalCost: 0 }
    stateMap[state][p.urgency_tier] = (stateMap[state][p.urgency_tier] || 0) + 1
    stateMap[state].total++
    stateMap[state].totalCost += p.proj_cost ?? 0
  })
  const stateData = Object.values(stateMap).sort((a, b) => b.total - a.total)

  // Aggregate by city
  const cityMap = {}
  patients.forEach(p => {
    const city  = p.city  || 'Unknown'
    const state = p.state || 'Unknown'
    if (!cityMap[city]) cityMap[city] = { city, state, URGENT: 0, HIGH: 0, MODERATE: 0, LOW: 0, total: 0, totalCost: 0 }
    cityMap[city][p.urgency_tier] = (cityMap[city][p.urgency_tier] || 0) + 1
    cityMap[city].total++
    cityMap[city].totalCost += p.proj_cost ?? 0
  })

  const [stateFilter, setStateFilter] = useState('All')
  const allStates = ['All', ...Object.keys(stateMap).sort()]

  const cityData = Object.values(cityMap)
    .filter(c => stateFilter === 'All' || c.state === stateFilter)
    .sort((a, b) => b[sortBy === 'urgent' ? 'URGENT' : sortBy === 'high' ? 'HIGH' : 'total'] - a[sortBy === 'urgent' ? 'URGENT' : sortBy === 'high' ? 'HIGH' : 'total'])
    .slice(0, 15)

  const topUrgent    = [...Object.values(cityMap)].sort((a,b) => b.URGENT - a.URGENT).slice(0, 5)
  const totalCities  = Object.keys(cityMap).length
  const STATE_COLORS = ['#0D9488', '#1B3A6B', '#7C3AED', '#B45309', '#065F46']

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-base font-bold text-gray-900">Geographic Distribution</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            CKD risk across {totalCities} cities · Top 15 shown
          </p>
        </header>

        <main className="flex-1 p-6 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-black text-gray-800">{totalCities}</p>
              <p className="text-xs text-gray-500 mt-1">Cities in registry</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-black text-red-600">{topUrgent[0]?.city ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Highest URGENT city</p>
              <p className="text-xs text-red-500 font-semibold">{topUrgent[0]?.URGENT ?? 0} urgent patients</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-black text-teal-600">
                {cityData[0]?.total ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Largest patient city</p>
              <p className="text-xs text-gray-400 font-medium">{cityData[0]?.city ?? '—'}</p>
            </div>
          </div>

          {/* State distribution chart */}
          <div className="card">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-800">Patient Distribution by State</p>
              <p className="text-xs text-gray-400 mt-0.5">Stacked urgency tiers — California & Texas</p>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={stateData} layout="vertical" barSize={28} margin={{ left: 90, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="state"
                  tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                  axisLine={false} tickLine={false} width={85}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 11 }}
                  formatter={(v, n) => [v.toLocaleString(), n]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {['URGENT','HIGH','MODERATE','LOW'].map(t => (
                  <Bar key={t} dataKey={t} stackId="a" fill={TIER_COLORS[t]}
                    radius={t === 'LOW' ? [0,4,4,0] : [0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {stateData.map((s, i) => (
                <div key={s.state} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: STATE_COLORS[i] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800">{s.state}</p>
                    <p className="text-xs text-gray-500">{s.total.toLocaleString()} patients · <span className="text-red-500 font-semibold">{s.URGENT} URGENT</span></p>
                  </div>
                  <p className="text-xs text-gray-400 ml-auto">${(s.totalCost/1e6).toFixed(1)}M</p>
                </div>
              ))}
            </div>
          </div>

          {/* City Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Top 15 Cities by Patient Count</p>
                <p className="text-xs text-gray-400 mt-0.5">Stacked by urgency tier</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="text-xs text-gray-500">State:</span>
                {allStates.map(s => (
                  <button
                    key={s}
                    onClick={() => setStateFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      stateFilter === s ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <span className="text-xs text-gray-400 mx-1">|</span>
                <span className="text-xs text-gray-500">Sort:</span>
                {[['urgent','URGENT'],['high','HIGH'],['total','Total']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSortBy(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      sortBy === val ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityData} layout="vertical" barSize={14} margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="city"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  axisLine={false} tickLine={false} width={75}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 11 }}
                  formatter={(v, n) => [v.toLocaleString(), n]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {['URGENT','HIGH','MODERATE','LOW'].map(t => (
                  <Bar key={t} dataKey={t} stackId="a" fill={TIER_COLORS[t]}
                    radius={t === 'LOW' ? [0,4,4,0] : [0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* City table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">City Detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['City','State','Total','URGENT','HIGH','MODERATE','LOW','Proj. Cost'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cityData.map(c => (
                    <tr key={c.city} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">{c.city}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.state}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{c.total.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="badge-urgent text-xs">{c.URGENT}</span></td>
                      <td className="px-4 py-3"><span className="badge-high text-xs">{c.HIGH}</span></td>
                      <td className="px-4 py-3"><span className="badge-moderate text-xs">{c.MODERATE}</span></td>
                      <td className="px-4 py-3"><span className="badge-low text-xs">{c.LOW}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600">${(c.totalCost/1000).toFixed(0)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
