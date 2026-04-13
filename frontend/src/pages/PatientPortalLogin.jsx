import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ShieldCheck, Lock, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '../api/client'

// ── Step 1: Enter activation code / Portal ID ──────────────
function ActivationStep({ onEnrolled, onNew }) {
  const [portalId, setPortalId] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleCheck = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/patient-check', { portal_id: portalId })
      if (data.enrolled) {
        onEnrolled()
      } else {
        onNew(portalId, data.record_id)
      }
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Portal ID not found. Check your care letter.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={28} className="text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Patient Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your Patient Portal ID from your care letter</p>
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-5 space-y-1.5">
        <p className="text-xs text-teal-700">🔒 Only <strong>your own</strong> health data is accessible</p>
        <p className="text-xs text-teal-700">⏱ Session expires after <strong>10 minutes</strong> of inactivity</p>
        <p className="text-xs text-teal-700">📋 Every access is <strong>logged</strong> per HIPAA §164.312</p>
      </div>

      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Portal ID</label>
          <input
            className="input font-mono tracking-widest text-center text-base"
            value={portalId}
            onChange={e => setPortalId(e.target.value)}
            placeholder="e.g. b9abfbd3"
            maxLength={36}
            autoFocus
            required
          />
          <p className="text-xs text-gray-400 mt-1 text-center">
            8-character code from your care letter
          </p>
        </div>
        {error && <ErrorBox msg={error} />}
        <button
          type="submit"
          disabled={loading || portalId.trim().length < 6}
          className="btn-primary w-full text-sm disabled:opacity-40"
        >
          {loading ? 'Checking…' : 'Continue →'}
        </button>
      </form>
    </div>
  )
}

// ── Step 2a: First-time — set username + password ──────────
function RegisterStep({ activationCode, onSuccess }) {
  const [form, setForm]       = useState({ username: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const pwChecks = {
    length:  form.password.length >= 8,
    upper:   /[A-Z]/.test(form.password),
    number:  /\d/.test(form.password),
    match:   form.password === form.confirm && form.confirm.length > 0,
  }
  const pwValid = Object.values(pwChecks).every(Boolean)

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!pwValid) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/patient-register', {
        activation_code: activationCode,
        username:        form.username,
        password:        form.password,
      })
      login(data)
      navigate('/portal')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <UserPlus size={28} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-sm text-gray-500 mt-1">First time here — set your personal login credentials</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-blue-700">
          ✅ Portal ID verified. Create a <strong>username and password</strong> you'll use for all future sign-ins.
          This replaces your Portal ID for ongoing access — just like Epic MyChart.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Choose a username</label>
          <input
            className="input"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="at least 4 characters, no spaces"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Create password</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              required
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>

          {/* Password strength checklist */}
          {form.password.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {[
                [pwChecks.length,  '8+ characters'],
                [pwChecks.upper,   'One uppercase'],
                [pwChecks.number,  'One number'],
                [pwChecks.match,   'Passwords match'],
              ].map(([ok, label]) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{ok ? '✓' : '○'}</span> {label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            className="input"
            type={showPw ? 'text' : 'password'}
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Re-enter password"
            required
          />
        </div>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          disabled={loading || !pwValid || form.username.length < 4}
          className="btn-primary w-full text-sm disabled:opacity-40"
        >
          {loading ? 'Creating account…' : '🔐 Create Account & Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── Step 2b: Returning patient — username + password ───────
function LoginStep({ onBack }) {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/patient-login', {
        username: form.username,
        password: form.password,
      })
      login(data)
      navigate('/portal')
    } catch (err) {
      const detail = err.response?.data?.detail ?? 'Login failed.'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Lock size={28} className="text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in with your patient portal credentials</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            className="input"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="Your username"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        {error && <ErrorBox msg={error} />}

        <button type="submit" disabled={loading}
          className="btn-primary w-full text-sm disabled:opacity-40">
          {loading ? 'Signing in…' : '🔓 Sign In'}
        </button>
      </form>

      <button onClick={onBack}
        className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        ← Use a different Portal ID
      </button>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  )
}

// ── Main component — orchestrates the 3 steps ──────────────
export default function PatientPortalLogin() {
  const [step, setStep]         = useState('activation')  // activation | register | login
  const [activationCode, setAC] = useState('')

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-white font-bold text-lg">🫘 CKDPredict</p>
          <p className="text-white/40 text-xs mt-0.5">Saint Louis University · MRP 2026</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {step === 'activation' && (
            <ActivationStep
              onEnrolled={() => setStep('login')}
              onNew={(code) => { setAC(code); setStep('register') }}
            />
          )}
          {step === 'register' && (
            <RegisterStep
              activationCode={activationCode}
              onSuccess={() => {}}
            />
          )}
          {step === 'login' && (
            <LoginStep onBack={() => setStep('activation')} />
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="text-gray-400 hover:text-gray-600 text-xs">
              ← Clinical staff sign-in
            </Link>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          HIPAA §164.312 compliant · All access logged · TLS encrypted
        </p>
      </div>
    </div>
  )
}
