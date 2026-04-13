import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

import Login              from './pages/Login'
import PatientPortalLogin from './pages/PatientPortalLogin'
import AdminDashboard     from './pages/AdminDashboard'
import PatientPortal      from './pages/PatientPortal'
import Analytics          from './pages/admin/Analytics'
import CostModel          from './pages/admin/CostModel'
import Geographic         from './pages/admin/Geographic'
import Outreach           from './pages/admin/Outreach'

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
        {/* Public */}
        <Route path="/login"          element={<Login />} />
        <Route path="/patient-login"  element={<PatientPortalLogin />} />

        {/* Admin */}
        <Route path="/admin"            element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/analytics"  element={<RequireAuth roles={['admin']}><Analytics /></RequireAuth>} />
        <Route path="/admin/cost"       element={<RequireAuth roles={['admin']}><CostModel /></RequireAuth>} />
        <Route path="/admin/geographic" element={<RequireAuth roles={['admin']}><Geographic /></RequireAuth>} />
        <Route path="/admin/outreach"   element={<RequireAuth roles={['admin']}><Outreach /></RequireAuth>} />

        {/* Patient */}
        <Route path="/portal" element={<RequireAuth roles={['patient']}><PatientPortal /></RequireAuth>} />

        {/* Default redirect */}
        <Route path="/" element={
          user?.role === 'admin'   ? <Navigate to="/admin" replace /> :
          user?.role === 'patient' ? <Navigate to="/portal" replace /> :
                                          <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
