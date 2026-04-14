import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import TierBadge from '../TierBadge'
import { SkeletonRow } from './SkeletonRow'

const TIER_ROW = {
  URGENT:   'bg-red-50/60 hover:bg-red-50',
  HIGH:     'bg-orange-50/40 hover:bg-orange-50',
  MODERATE: 'bg-yellow-50/30 hover:bg-yellow-50',
  LOW:      'hover:bg-gray-50',
}

const COLS = [
  { key: 'patient_id',    label: 'Patient ID',    sortable: true },
  { key: 'risk_score',    label: 'Risk Score',    sortable: true },
  { key: 'urgency_tier',  label: 'Tier',          sortable: true },
  { key: 'est_months',    label: 'Timeline',      sortable: false },
  { key: 'model',         label: 'Model',         sortable: true },
  { key: 'age',           label: 'Age',           sortable: true },
  { key: 'gender',        label: 'Gender',        sortable: false },
  { key: 'city',          label: 'City',          sortable: false },
  { key: 'proj_cost',     label: 'Proj. Cost',    sortable: true },
]

function SortIcon({ col, sortKey, dir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-gray-300 ml-1" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-teal-500 ml-1" />
    : <ChevronDown size={12} className="text-teal-500 ml-1" />
}

export default function RegistryTable({ patients, loading, page, perPage, total, onPage, onPerPage }) {
  const [sortKey, setSortKey] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (!COLS.find(c => c.key === key)?.sortable) return
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...patients].sort((a, b) => {
    const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="card p-0 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              {COLS.map(({ key, label, sortable }) => (
                <th
                  key={key}
                  onClick={() => sortable && handleSort(key)}
                  className={`text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3
                    ${sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                >
                  <div className="flex items-center">
                    {label}
                    {sortable && <SortIcon col={key} sortKey={sortKey} dir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: perPage }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500 font-medium">No patients match your filters</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting the risk score or tier filters</p>
                  </td>
                </tr>
              )
              : sorted.map(p => (
                <tr key={p.patient_id} className={`transition-colors ${TIER_ROW[p.urgency_tier] ?? 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.patient_id.slice(0, 8)}
                    <span className="text-gray-300">…</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.risk_score * 100}%`,
                            background: p.urgency_tier === 'URGENT' ? '#DC2626'
                              : p.urgency_tier === 'HIGH' ? '#EA580C'
                              : p.urgency_tier === 'MODERATE' ? '#CA8A04' : '#16A34A'
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-gray-700">
                        {(p.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><TierBadge tier={p.urgency_tier} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.est_months}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                      ${p.model === 'A'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                      {p.model === 'A' ? 'A · Diabetic' : p.model === 'B' ? 'B · Non-Diabetic' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.age ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{{ M:'Male', F:'Female' }[p.gender] ?? p.gender ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.city ?? '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                    {p.proj_cost ? `$${Number(p.proj_cost).toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rows per page</span>
          <select
            className="input py-1 text-xs w-16"
            value={perPage}
            onChange={e => onPerPage(Number(e.target.value))}
          >
            {[25, 50, 100].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">
            Page {page + 1} of {totalPages || 1}
          </span>
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 0}
            className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
          >←</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
            return (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                  ${page === p ? 'bg-teal-500 text-white' : 'border border-gray-200 hover:bg-gray-100 text-gray-600'}`}
              >
                {p + 1}
              </button>
            )
          })}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
          >→</button>
        </div>
      </div>
    </div>
  )
}
