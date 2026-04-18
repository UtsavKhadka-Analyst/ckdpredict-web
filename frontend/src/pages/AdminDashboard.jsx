import { useEffect, useState } from 'react'
import {
  Users, AlertTriangle, TrendingUp, DollarSign,
  Download, CheckCircle2
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import KpiCard from '../components/admin/KpiCard'
import FilterBar from '../components/admin/FilterBar'
import RegistryTable from '../components/admin/RegistryTable'
import ChartsPanel from '../components/admin/ChartsPanel'
import PatientGuidancePanel from '../components/admin/PatientGuidancePanel'
import { SkeletonCard } from '../components/admin/SkeletonRow'
import api from '../api/client'
import { useRegistry } from '../context/RegistryContext'

const TIERS = ['URGENT', 'HIGH', 'MODERATE', 'LOW']

const DEFAULT_FILTERS = {
  search: '', tier: '', gender: '', ageGroup: '', city: '', minRisk: 0, model: '', state: '',
}

function ageGroupFilter(age, group) {
  if (!group || age == null) return true
  const a = Number(age)
  if (group === '18–40')  return a >= 18 && a <= 40
  if (group === '41–60')  return a >= 41 && a <= 60
  if (group === '61–75')  return a >= 61 && a <= 75
  if (group === '75+')    return a > 75
  return true
}

export default function AdminDashboard() {
  const { patients: allPatients, stats, loading } = useRegistry()
  const [filters, setFilters]       = useState(DEFAULT_FILTERS)
  const [activeTier, setActiveTier] = useState('')
  const [page, setPage]             = useState(0)
  const [perPage, setPerPage]       = useState(50)
  const [showCharts, setShowCharts]       = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)

  // Reset page on filter change
  useEffect(() => setPage(0), [filters, activeTier])

  // Apply all filters client-side (500 patients loaded upfront)
  const filtered = allPatients.filter(p => {
    if (activeTier && p.urgency_tier !== activeTier) return false
    if (filters.tier && p.urgency_tier !== filters.tier) return false
    if (filters.search && !p.patient_id.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.gender && p.gender !== filters.gender) return false
    if (filters.city && !p.city?.toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.minRisk && p.risk_score * 100 < filters.minRisk) return false
    if (!ageGroupFilter(p.age, filters.ageGroup)) return false
    if (filters.model && p.model !== filters.model) return false
    if (filters.state && p.state !== filters.state) return false
    return true
  })

  // Derive unique states from loaded patients (auto-updates when new states added)
  const states = [...new Set(allPatients.map(p => p.state).filter(Boolean))].sort()

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

  const handleKpiClick = (tier) => {
    setActiveTier(prev => prev === tier ? '' : tier)
  }

  const handleFilterChange = (patch) => setFilters(f => ({ ...f, ...patch }))
  const handleClearFilters = () => { setFilters(DEFAULT_FILTERS); setActiveTier('') }

  const handleExport = async () => {
    const res = await api.get('/registry/export', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url
    a.download = `ckd_registry_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const KPI_CARDS = stats ? [
    {
      icon: Users, label: 'Total Patients', value: stats.total_patients,
      sub: 'In active registry', color: 'text-gray-900', bgColor: 'bg-navy',
      tier: '', tooltip: 'All patients in the CKD risk registry'
    },
    {
      icon: AlertTriangle, label: 'URGENT', value: stats.urgent,
      sub: `${((stats.urgent/stats.total_patients)*100).toFixed(1)}% of registry`,
      color: 'text-red-600', bgColor: 'bg-red-500',
      tier: 'URGENT', tooltip: 'Risk score ≥ 85% — contact within 24–48 hrs'
    },
    {
      icon: AlertTriangle, label: 'HIGH', value: stats.high,
      sub: `${((stats.high/stats.total_patients)*100).toFixed(1)}% of registry`,
      color: 'text-orange-600', bgColor: 'bg-orange-500',
      tier: 'HIGH', tooltip: 'Risk score 65–85% — schedule within 2 weeks'
    },
    {
      icon: DollarSign, label: 'Projected Cost', value: `$${(stats.total_proj_cost/1e6).toFixed(1)}M`,
      sub: 'Annual Medicare est.', color: 'text-gray-900', bgColor: 'bg-purple-500',
      tier: '', tooltip: 'Total annual projected cost across all patients · USRDS 2023'
    },
    {
      icon: TrendingUp, label: 'Potential Savings', value: `$${(stats.potential_savings/1e6).toFixed(1)}M`,
      sub: 'With early intervention', color: 'text-teal-600', bgColor: 'bg-teal-500',
      tier: '', tooltip: 'Savings achievable through early CKD intervention programs'
    },
  ] : []

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div>
            <h1 className="text-base font-bold text-gray-900">Patient Risk Registry</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Population-level CKD risk overview · Saint Louis University MRP 2026
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCharts(v => !v)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              {showCharts ? 'Hide charts' : 'Show charts'}
            </button>
            <button onClick={handleExport} className="btn-primary flex items-center gap-1.5 py-1.5 px-4 text-xs">
              <Download size={12} /> Export CSV
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Clinical decision support only</strong> — model trained on Synthea synthetic EHR data.
              Not validated on real patient populations. KDIGO 2024 · USRDS 2023.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : KPI_CARDS.map(({ tier, ...props }) => (
                <KpiCard
                  key={props.label}
                  {...props}
                  active={tier ? activeTier === tier : false}
                  onClick={() => tier && handleKpiClick(tier)}
                />
              ))
            }
          </div>

          {/* Tier pill filters */}
          {!loading && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="text-xs text-gray-400 self-center mr-1">Quick filter:</span>
              {TIERS.map(t => {
                const colors = {
                  URGENT:   activeTier === t ? 'bg-red-500 text-white'   : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
                  HIGH:     activeTier === t ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100',
                  MODERATE: activeTier === t ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100',
                  LOW:      activeTier === t ? 'bg-green-600 text-white'  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
                }
                return (
                  <button
                    key={t}
                    onClick={() => handleKpiClick(t)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${colors[t]}`}
                  >
                    {t} · {stats?.[t.toLowerCase()].toLocaleString()}
                  </button>
                )
              })}
              {activeTier && (
                <button
                  onClick={() => setActiveTier('')}
                  className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          )}

          {/* Charts */}
          {showCharts && !loading && <ChartsPanel stats={stats} />}

          {/* Filter bar */}
          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            totalShown={filtered.length}
            totalAll={allPatients.length}
            states={states}
          />

          {/* Table */}
          <p className="text-xs text-gray-400 mb-2 ml-1">
            💡 Click any row to view KDIGO 2024 clinical guidance for that patient
          </p>

          <RegistryTable
            patients={paginated}
            loading={loading}
            page={page}
            perPage={perPage}
            total={filtered.length}
            onPage={setPage}
            onPerPage={(n) => { setPerPage(n); setPage(0) }}
            onSelectPatient={setSelectedPatient}
          />

          <PatientGuidancePanel
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        </main>

        <footer className="text-center text-xs text-gray-300 py-3 border-t border-gray-100">
          CKDPredict · Synthea synthetic EHR · Not for clinical use · KDIGO 2024 / USRDS 2023
        </footer>
      </div>
    </div>
  )
}
