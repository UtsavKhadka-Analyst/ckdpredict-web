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

  // Aggregate by city
  const cityMap = {}
  patients.forEach(p => {
    const city = p.city || 'Unknown'
    if (!cityMap[city]) cityMap[city] = { city, URGENT: 0, HIGH: 0, MODERATE: 0, LOW: 0, total: 0, totalCost: 0 }
    cityMap[city][p.urgency_tier] = (cityMap[city][p.urgency_tier] || 0) + 1
    cityMap[city].total++
    cityMap[city].totalCost += p.proj_cost ?? 0
  })

  const cityData = Object.values(cityMap)
    .sort((a, b) => b[sortBy === 'urgent' ? 'URGENT' : sortBy === 'high' ? 'HIGH' : 'total'] - a[sortBy === 'urgent' ? 'URGENT' : sortBy === 'high' ? 'HIGH' : 'total'])
    .slice(0, 15)

  const topUrgent = [...cityData].sort((a,b) => b.URGENT - a.URGENT).slice(0, 5)
  const totalCities = Object.keys(cityMap).length

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

          {/* Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Top 15 Cities by Patient Count</p>
                <p className="text-xs text-gray-400 mt-0.5">Stacked by urgency tier</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort by:</span>
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
                    {['City','Total','URGENT','HIGH','MODERATE','LOW','Proj. Cost'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cityData.map(c => (
                    <tr key={c.city} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">{c.city}</td>
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
