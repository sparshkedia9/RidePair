/* Campus configuration (hubs, pickup points, vehicle + luggage options,
   scoring weights) fetched once and shared by every form on the site. */
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

export const MetaContext = createContext(null)

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .meta()
      .then((data) => { if (!cancelled) setMeta(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [])

  return (
    <MetaContext.Provider value={{ meta, error }}>{children}</MetaContext.Provider>
  )
}

export function useMeta() {
  const ctx = useContext(MetaContext)
  if (!ctx) throw new Error('useMeta must be used inside <MetaProvider>')
  return ctx
}

/** Convenience: look up a hub record by its name. */
export function useHub(name) {
  const { meta } = useMeta()
  return meta?.hubs?.find((h) => h.name === name) || null
}
