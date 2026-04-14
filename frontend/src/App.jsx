import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { RegistryProvider } from './context/RegistryContext'

import Login              from './pages/Login'
import PatientPortalLogin from './pages/PatientPortalLogin'
import AdminDashboard     from './pages/AdminDashboard'
import PatientPortal      from './pages/PatientPortal'
import Analytics          from './pages/admin/Analytics'
import CostModel          from './pages/admin/CostModel'
import Geographic         from './pages/admin/Geographic'
import Outreach           from './pages/admin/Outreach'
import ModelValidity      from './pages/admin/ModelValidity'

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

        {/* Admin — one RegistryProvider wraps all routes; data fetched once, shared across pages */}
        <Route element={<RequireAuth roles={['admin']}><RegistryProvider><Outlet /></RegistryProvider></RequireAuth>}>
          <Route path="/admin"            element={<AdminDashboard />} />
          <Route path="/admin/analytics"  element={<Analytics />} />
          <Route path="/admin/cost"       element={<CostModel />} />
          <Route path="/admin/geographic" element={<Geographic />} />
          <Route path="/admin/outreach"        element={<Outreach />} />
          <Route path="/admin/model-validity" element={<ModelValidity />} />
        </Route>

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
