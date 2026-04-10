import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, DollarSign, MapPin,
  Send, LogOut, Activity
} from 'lucide-react'

const NAV = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Registry',    end: true },
  { to: '/admin/analytics',    icon: Activity,        label: 'Analytics' },
  { to: '/admin/cost',         icon: DollarSign,      label: 'Cost Model' },
  { to: '/admin/geographic',   icon: MapPin,          label: 'Geographic' },
  { to: '/admin/outreach',     icon: Send,            label: 'Outreach' },
  { to: '/nephrologist',       icon: Users,           label: 'Patient View' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="w-56 shrink-0 bg-navy min-h-screen flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-base">🫘</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">CKDPredict</p>
            <p className="text-white/40 text-xs">SLU MRP 2026</p>
          </div>
        </div>
      </div>

      {/* User pill */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="bg-white/8 rounded-xl px-3 py-2">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-0.5">Administrator</p>
          <p className="text-white text-sm font-medium truncate">{user?.username}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all w-full"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
