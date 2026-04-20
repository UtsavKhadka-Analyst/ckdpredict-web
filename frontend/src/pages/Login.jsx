import { useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/client'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      login(data)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <HeartPulse size={30} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">CKDPredict</h1>
          <p className="text-white/50 text-sm mt-1">Clinical Decision Support · Saint Louis University</p>
          <p className="text-white/30 text-xs mt-2 max-w-xs mx-auto">
            ML-powered CKD risk stratification for population health management
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Clinical Staff Sign-In</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-2">Are you a patient?</p>
            <Link to="/patient-login" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              Go to Patient Portal →
            </Link>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-6 leading-relaxed max-w-xs mx-auto">
          🔒 HIPAA-compliant · Access restricted to authorized clinical staff only<br/>
          Saint Louis University · MS Analytics MRP 2026
        </p>
      </div>
    </div>
  )
}
