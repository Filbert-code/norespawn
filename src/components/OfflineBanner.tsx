import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

// Thin banner that flips when the browser reports offline. Mutations still go
// through TanStack Query (and will surface their own errors), but a global hint
// keeps the user from blaming the app for nothing happening when the network
// is the actual culprit.
export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  if (online) return null
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-nr-bronze/30 bg-nr-bronze/15 py-1.5 text-[10px] uppercase tracking-[0.3em] text-nr-bronze"
    >
      <WifiOff className="size-3" />
      Offline · changes won't sync until reconnected
    </div>
  )
}
