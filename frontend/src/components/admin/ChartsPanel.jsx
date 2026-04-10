import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const TIER_COLORS = {
  URGENT: '#DC2626', HIGH: '#EA580C', MODERATE: '#CA8A04', LOW: '#16A34A'
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="text-gray-500">{payload[0].value?.toLocaleString()} patients</p>
    </div>
  )
}

export default function ChartsPanel({ stats }) {
  if (!stats) return null

  const donutData = [
    { name: 'URGENT',   value: stats.urgent },
    { name: 'HIGH',     value: stats.high },
    { name: 'MODERATE', value: stats.moderate },
    { name: 'LOW',      value: stats.low },
  ]

  const costData = [
    { tier: 'No CKD',   projected: 13604,   benchmark: 13604 },
    { tier: 'CKD Stg 3', projected: 28162,  benchmark: 28162 },
    { tier: 'ESKD',      projected: 104000, benchmark: 104000 },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Donut — tier distribution */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Risk Tier Distribution
        </p>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={140}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%" cy="50%"
                innerRadius={38} outerRadius={58}
                paddingAngle={2}
                dataKey="value"
              >
                {donutData.map(({ name }) => (
                  <Cell key={name} fill={TIER_COLORS[name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {donutData.map(({ name, value }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLORS[name] }} />
                  <span className="text-gray-600 font-medium">{name}</span>
                </div>
                <span className="font-mono font-semibold text-gray-700">
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar — cost benchmarks */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Medicare Cost Benchmarks
        </p>
        <p className="text-xs text-gray-400 mb-3">Annual per-patient cost · USRDS 2023</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={costData} barSize={28} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="tier" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              axisLine={false} tickLine={false}
            />
            <Bar dataKey="projected" name="Annual Cost" radius={[6,6,0,0]}>
              {costData.map((_, i) => (
                <Cell key={i} fill={['#16A34A','#EA580C','#DC2626'][i]} />
              ))}
            </Bar>
            <Tooltip
              formatter={v => [`$${Number(v).toLocaleString()}`, 'Annual cost']}
              contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 11 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
