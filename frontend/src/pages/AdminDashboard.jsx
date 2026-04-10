import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, AlertTriangle, TrendingUp, DollarSign, Download } from 'lucide-react'
import Layout from '../components/Layout'
import TierBadge from '../components/TierBadge'
import api from '../api/client'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null)
  const [patients, setPatients] = useState([])
  const [tier, setTier]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/registry/stats'),
      api.get('/registry/', { params: { limit: 50, tier: tier || undefined } }),
    ])
      .then(([s, r]) => {
        setStats(s.data)
        setPatients(r.data.patients)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [tier])

  const handleExport = async () => {
    const res = await api.get('/registry/export', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a   = document.createElement('a')
    a.href = url; a.download = 'ckd_registry.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <Layout title="Admin Dashboard"><p className="text-gray-400">Loading…</p></Layout>
  if (error)   return <Layout title="Admin Dashboard"><p className="text-red-500">{error}</p></Layout>

  return (
    <Layout
      title="Patient Risk Registry"
      subtitle="Population-level CKD risk overview · Saint Louis University MRP 2026"
    >
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}         label="Total Patients"    value={stats.total_patients.toLocaleString()} color="bg-navy" />
        <StatCard icon={AlertTriangle} label="Urgent + High"     value={(stats.urgent + stats.high).toLocaleString()} sub="Require intervention" color="bg-red-500" />
        <StatCard icon={DollarSign}    label="Projected Cost"    value={`$${(stats.total_proj_cost/1e6).toFixed(1)}M`} sub="Annual Medicare est." color="bg-orange-500" />
        <StatCard icon={TrendingUp}    label="Potential Savings" value={`$${(stats.potential_savings/1e6).toFixed(1)}M`} sub="With early intervention" color="bg-teal-500" />
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { tier: 'URGENT',   n: stats.urgent,   color: 'bg-red-50 border-red-200 text-red-700' },
          { tier: 'HIGH',     n: stats.high,     color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { tier: 'MODERATE', n: stats.moderate, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { tier: 'LOW',      n: stats.low,      color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(({ tier: t, n, color }) => (
          <div key={t} className={`rounded-xl border p-4 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{t}</p>
            <p className="text-3xl font-bold mt-1">{n.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-0.5">{((n / stats.total_patients) * 100).toFixed(1)}% of registry</p>
          </div>
        ))}
      </div>

      {/* Registry table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Patient Registry</h2>
          <div className="flex items-center gap-3">
            <select
              className="input w-40 py-1.5 text-xs"
              value={tier}
              onChange={e => setTier(e.target.value)}
            >
              <option value="">All tiers</option>
              {['URGENT', 'HIGH', 'MODERATE', 'LOW'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
              <Download size={13} /> Export CSV
            </button>
            <Link to="/nephrologist" className="btn-primary py-1.5 px-3 text-xs">
              Individual View →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Patient ID', 'Risk Score', 'Tier', 'Est. Timeline', 'Age', 'Gender', 'City', 'Proj. Cost'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map(p => (
                <tr key={p.patient_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.patient_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${p.risk_score * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono">{(p.risk_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><TierBadge tier={p.urgency_tier} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.est_months}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.age ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.gender ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.city ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {p.proj_cost ? `$${p.proj_cost.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Showing top 50 by risk score · USRDS 2023 cost benchmarks · Synthea synthetic data
      </p>
    </Layout>
  )
}
