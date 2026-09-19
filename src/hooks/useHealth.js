import { useEffect } from 'react'
import { health } from '../lib/api'
import { useGraphStore } from '../store/useGraphStore'

/** Pings the brain every 30 s so the status lamp is honest. */
export default function useHealth() {
  const setHealth = useGraphStore((s) => s.setHealth)
  useEffect(() => {
    let alive = true
    const ping = async () => {
      try {
        const data = await health()
        if (!alive) return
        setHealth({ status: data.model === 'mock' ? 'mock' : 'online', model: data.model, whisper: data.whisper, research: data.research })
      } catch {
        if (alive) setHealth({ status: 'offline', model: null, whisper: null })
      }
    }
    ping()
    const timer = setInterval(ping, 30_000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [setHealth])
}
