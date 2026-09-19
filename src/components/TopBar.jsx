import { PanelLeft, Share2, Link2, HelpCircle } from 'lucide-react'
import Brand from './Brand'
import ModeDial from './ModeDial'
import { IconButton, GhostButton, Kbd } from './ui'
import { useGraphStore } from '../store/useGraphStore'

function HealthLamp() {
  const health = useGraphStore((s) => s.health)
  const map = {
    checking: { dot: 'bg-muted/60 rec-dot', text: 'checking' },
    online: { dot: 'bg-sage', text: (health.model ?? 'online').replace('-versatile', '') },
    mock: { dot: 'bg-bronze', text: 'mock brain' },
    offline: { dot: 'bg-collision', text: 'brain offline' },
  }
  const v = map[health.status] ?? map.checking
  return (
    <span
      className="hidden items-center gap-2 whitespace-nowrap readout text-muted/80 sm:inline-flex"
      title={health.status === 'online' ? `Groq · ${health.model} · Whisper ${health.whisper ?? ''}` : health.status === 'offline' ? 'Start neurograph-server on :4000' : undefined}
    >
      <span className={`size-1.5 rounded-full ${v.dot}`} aria-hidden="true" />
      {v.text}
    </span>
  )
}

function RoomChip() {
  const roomId = useGraphStore((s) => s.roomId)
  const demoMode = useGraphStore((s) => s.demoMode)
  const pushToast = useGraphStore((s) => s.pushToast)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      pushToast({ title: 'Room link copied', detail: 'Anyone with it lands in this chart.' })
    } catch {
      pushToast({ title: 'Could not copy', detail: 'Use Share to grab the link.', tone: 'collision' })
    }
  }
  if (demoMode) return <span className="readout hidden whitespace-nowrap rounded-[3px] border border-bronze/40 px-2 py-1 text-bronze md:inline">demo · unsaved</span>
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy room link"
      className="group hidden h-8 items-center gap-2 rounded-[3px] border border-hairline px-2.5 readout text-muted transition-colors hover:border-teal/60 hover:text-ink md:inline-flex"
    >
      <Link2 className="size-3 text-teal transition-colors group-hover:text-bronze" aria-hidden="true" />
      <span className="max-w-[160px] truncate">{roomId ?? 'preparing room…'}</span>
    </button>
  )
}

export default function TopBar({ onShare, shareDisabled }) {
  const username = useGraphStore((s) => s.username)
  const logbookOpen = useGraphStore((s) => s.ui.logbook)
  const toggleLogbook = useGraphStore((s) => s.toggleLogbook)
  const setPalette = useGraphStore((s) => s.setPalette)
  const setShortcuts = useGraphStore((s) => s.setShortcuts)

  return (
    <header className="relative z-40 grid h-[52px] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden border-b border-hairline px-3 md:grid-cols-[1fr_auto_1fr] md:px-4">
      <div className="flex items-center gap-2">
        <IconButton label={logbookOpen ? 'Hide logbook (⌘/)' : 'Show logbook (⌘/)'} active={logbookOpen} onClick={toggleLogbook}>
          <PanelLeft className="size-4" strokeWidth={1.5} />
        </IconButton>
        <Brand />
      </div>

      <ModeDial />

      <div className="flex items-center justify-end gap-2">
        <HealthLamp />
        <RoomChip />
        {username && (
          <span className="hidden items-center gap-2 text-[11.5px] text-muted lg:inline-flex" title={`Charting as ${username}`}>
            <span className="grid size-6 place-items-center rounded-full border border-bronze/50 bg-bronze/10 font-mono text-[10px] text-ink" aria-hidden="true">
              {Array.from(username)[0]?.toUpperCase()}
            </span>
            <span className="max-w-24 truncate">{username}</span>
          </span>
        )}
        <GhostButton onClick={onShare} disabled={shareDisabled} aria-haspopup="dialog">
          <Share2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> <span className="hidden sm:inline">Share</span>
        </GhostButton>
        <span className="hidden sm:block">
          <GhostButton onClick={() => setPalette(true)} title="Command palette">
            <Kbd>⌘K</Kbd> <span className="text-muted">commands</span>
          </GhostButton>
        </span>
        <IconButton label="Keyboard shortcuts (?)" onClick={() => setShortcuts(true)}>
          <HelpCircle className="size-4" strokeWidth={1.5} />
        </IconButton>
      </div>
    </header>
  )
}
