import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const RegistryContext = createContext(null)

export function RegistryProvider({ children }) {
  const [patients, setPatients] = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setError(null)
    // Fetch stats and full patient list independently so one failure doesn't block the other
    api.get('/registry/stats')
      .then(s => setStats(s.data))
      .catch(e => console.error('Stats fetch failed:', e))

    api.get('/registry/', { params: { limit: 25000 } })
      .then(r => setPatients(r.data.patients ?? []))
      .catch(e => {
        console.error('Registry fetch failed:', e)
        setError('Failed to load patient registry. Please refresh the page.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <RegistryContext.Provider value={{ patients, stats, loading, error }}>
      {children}
    </RegistryContext.Provider>
  )
}

export function useRegistry() {
  return useContext(RegistryContext)
}
