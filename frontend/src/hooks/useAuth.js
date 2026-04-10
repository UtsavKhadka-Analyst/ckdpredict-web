import { useState, useEffect } from 'react'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ckd_user')) } catch { return null }
  })

  const login = (tokenData) => {
    localStorage.setItem('ckd_token', tokenData.access_token)
    localStorage.setItem('ckd_user', JSON.stringify({
      username: tokenData.username,
      role: tokenData.role,
    }))
    setUser({ username: tokenData.username, role: tokenData.role })
  }

  const logout = () => {
    localStorage.removeItem('ckd_token')
    localStorage.removeItem('ckd_user')
    setUser(null)
  }

  return { user, login, logout }
}
