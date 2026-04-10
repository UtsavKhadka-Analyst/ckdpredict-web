import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Activity } from 'lucide-react'

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleBadge = {
    admin:         { label: 'Administrator',  color: 'bg-purple-100 text-purple-700' },
    nephrologist:  { label: 'Nephrologist',   color: 'bg-blue-100 text-blue-700' },
    patient:       { label: 'Patient Portal', color: 'bg-teal-100 text-teal-700' },
  }[user?.role] ?? { label: user?.role, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-navy border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-lg">🫘</div>
          <span className="text-white font-semibold text-sm tracking-wide">CKDPredict</span>
          <span className="text-white/30 text-sm">|</span>
          <span className="text-white/60 text-xs">Saint Louis University · MRP 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
          <span className="text-white/60 text-xs">{user?.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Page header */}
      {(title || subtitle) && (
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          {title   && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-8">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        CKDPredict · Synthetic EHR data (Synthea) · Not for clinical use · KDIGO 2024 / USRDS 2023
      </footer>
    </div>
  )
}
