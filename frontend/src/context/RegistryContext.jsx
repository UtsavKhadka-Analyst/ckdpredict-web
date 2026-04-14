import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const RegistryContext = createContext(null)

export function RegistryProvider({ children }) {
  const [patients, setPatients] = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/registry/stats'),
      api.get('/registry/', { params: { limit: 20000 } }),
    ]).then(([s, r]) => {
      setStats(s.data)
      setPatients(r.data.patients)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <RegistryContext.Provider value={{ patients, stats, loading }}>
      {children}
    </RegistryContext.Provider>
  )
}

export function useRegistry() {
  return useContext(RegistryContext)
}
