import { useEffect, useRef, useState } from 'react'

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return val
}

export default function KpiCard({ icon: Icon, label, value, sub, color, bgColor, active, onClick, tooltip }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0)
  const display  = typeof value === 'number' ? animated.toLocaleString() : value

  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`card text-left w-full transition-all duration-200 hover:shadow-md group
        ${active ? 'ring-2 ring-teal-500 shadow-md' : 'hover:ring-1 hover:ring-gray-200'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">{label}</p>
          <p className={`text-2xl font-black mt-0.5 font-mono ${color}`}>{display}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>}
        </div>
        {active && (
          <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1" />
        )}
      </div>
    </button>
  )
}
