import { useGraphStore } from '../store/useGraphStore'
import { Kbd } from './ui'

export default function StatusBar() {
  const roomId = useGraphStore((s) => s.roomId)
  const username = useGraphStore((s) => s.username)
  const last = useGraphStore((s) => s.lastResult)
  const demoMode = useGraphStore((s) => s.demoMode)
  const m = last?.meta
  const tokens = m?.tokens ? m.tokens.prompt + m.tokens.completion : null
  return (
    <footer className="relative z-40 hidden h-7 items-center justify-between gap-4 border-t border-hairline px-4 readout text-muted/55 md:flex">
      <span className="min-w-0 truncate">{demoMode ? 'demo · unsaved' : roomId ?? 'preparing room…'}{username ? ` · ${username}` : ''}</span>
      <span className="min-w-0 truncate">
        {m ? `${(m.model ?? '').replace('-versatile', '') || 'model'} · ${m.latencyMs ?? '–'} ms${tokens ? ` · ${(tokens / 1000).toFixed(1)}k tokens` : ''} · ${m.intent ?? 'analytical'}${m.mock ? ' · mock' : ''}` : 'no synthesis yet'}
      </span>
      <span className="flex shrink-0 items-center gap-3"><span><Kbd>⌘↵</Kbd> synthesize</span><span><Kbd>⌘K</Kbd> commands</span><span><Kbd>?</Kbd> keys</span></span>
    </footer>
  )
}
