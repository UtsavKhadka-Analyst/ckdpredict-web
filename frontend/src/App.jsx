import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import PatientPortalLogin from './pages/PatientPortalLogin'
import AdminDashboard from './pages/AdminDashboard'
import NephDashboard from './pages/NephDashboard'
import PatientPortal from './pages/PatientPortal'

function RequireAuth({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/patient-login" element={<PatientPortalLogin />} />

        <Route path="/admin" element={
          <RequireAuth roles={['admin']}>
            <AdminDashboard />
          </RequireAuth>
        } />

        <Route path="/nephrologist" element={
          <RequireAuth roles={['admin', 'nephrologist']}>
            <NephDashboard />
          </RequireAuth>
        } />

        <Route path="/portal" element={
          <RequireAuth roles={['patient']}>
            <PatientPortal />
          </RequireAuth>
        } />

        {/* Default redirect based on role */}
        <Route path="/" element={
          user?.role === 'admin'         ? <Navigate to="/admin" replace /> :
          user?.role === 'nephrologist'  ? <Navigate to="/nephrologist" replace /> :
          user?.role === 'patient'       ? <Navigate to="/portal" replace /> :
                                           <Navigate to="/login" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
