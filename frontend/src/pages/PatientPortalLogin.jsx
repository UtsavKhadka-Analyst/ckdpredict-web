import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/client'

export default function PatientPortalLogin() {
  const [portalId, setPortalId] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/patient-portal', { portal_id: portalId })
      login(data)
      navigate('/portal')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Portal ID not found.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-white text-2xl font-bold">Patient Portal</h1>
          <p className="text-white/50 text-sm mt-1">Secure access to your kidney health summary</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-5">
            <p className="text-teal-800 text-xs leading-relaxed">
              Enter the <strong>8-character Patient Portal ID</strong> from your care letter.
              Your session expires automatically after <strong>10 minutes</strong> of inactivity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Portal ID
              </label>
              <input
                className="input font-mono tracking-widest text-center text-lg"
                value={portalId}
                onChange={e => setPortalId(e.target.value)}
                placeholder="b9abfbd3"
                maxLength={36}
                autoFocus
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                First 8 characters of your ID from your care letter
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || portalId.trim().length < 6}
              className="btn-primary w-full text-center"
            >
              {loading ? 'Verifying…' : '🔓 Access My Health Summary'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link to="/login" className="text-gray-400 hover:text-gray-600 text-xs">
              ← Clinical staff sign-in
            </Link>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          No data is visible until you sign in · HIPAA-compliant session isolation
        </p>
      </div>
    </div>
  )
}
