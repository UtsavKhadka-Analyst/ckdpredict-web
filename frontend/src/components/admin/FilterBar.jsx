import { Search, X, SlidersHorizontal } from 'lucide-react'

const TIERS    = ['URGENT', 'HIGH', 'MODERATE', 'LOW']
const GENDERS  = [{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }]
const AGE_GROUPS = ['18–40', '41–60', '61–75', '75+']
const MODELS   = [{ label: 'Model A (Diabetic)', value: 'A' }, { label: 'Model B (Non-Diabetic)', value: 'B' }]

export default function FilterBar({ filters, onChange, onClear, totalShown, totalAll, states = [] }) {
  const hasActive = filters.search || filters.gender || filters.ageGroup ||
    filters.minRisk > 0 || filters.city || filters.model || filters.state

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
        <span className="ml-auto text-xs text-gray-400">
          Showing <strong className="text-gray-700">{totalShown.toLocaleString()}</strong> of {totalAll.toLocaleString()} patients
        </span>
        {hasActive && (
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium ml-2">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 py-1.5 text-xs w-full"
            placeholder="Search patient ID…"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
          />
        </div>

        {/* Risk score slider */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <span className="text-xs text-gray-500 shrink-0">Min risk</span>
          <input
            type="range" min={0} max={100} step={5}
            value={filters.minRisk}
            onChange={e => onChange({ minRisk: Number(e.target.value) })}
            className="accent-teal-500 flex-1"
          />
          <span className="text-xs font-mono font-semibold text-teal-600 w-8 text-right">
            {filters.minRisk}%
          </span>
        </div>

        {/* Gender */}
        <select
          className="input py-1.5 text-xs w-32"
          value={filters.gender}
          onChange={e => onChange({ gender: e.target.value })}
        >
          <option value="">All genders</option>
          {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>

        {/* Age group */}
        <select
          className="input py-1.5 text-xs w-32"
          value={filters.ageGroup}
          onChange={e => onChange({ ageGroup: e.target.value })}
        >
          <option value="">All ages</option>
          {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
        </select>

        {/* City */}
        <input
          className="input py-1.5 text-xs w-36"
          placeholder="City…"
          value={filters.city}
          onChange={e => onChange({ city: e.target.value })}
        />

        {/* Model */}
        <select
          className="input py-1.5 text-xs w-44"
          value={filters.model}
          onChange={e => onChange({ model: e.target.value })}
        >
          <option value="">All models</option>
          {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* State */}
        {states.length > 1 && (
          <select
            className="input py-1.5 text-xs w-36"
            value={filters.state}
            onChange={e => onChange({ state: e.target.value })}
          >
            <option value="">All states</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}
