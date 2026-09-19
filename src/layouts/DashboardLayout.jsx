import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Logbook from '../components/Logbook'
import Canvas from '../components/Canvas'
import Inspector from '../components/Inspector'
import StatusBar from '../components/StatusBar'
import CommandPalette from '../components/CommandPalette'
import ShortcutsSheet from '../components/ShortcutsSheet'
import Toasts from '../components/Toasts'
import NameModal from '../components/collaboration/NameModal'
import ShareModal from '../components/collaboration/ShareModal'
import useRoomSession from '../hooks/useRoomSession'
import useHealth from '../hooks/useHealth'
import useHotkeys from '../hooks/useHotkeys'
import { useGraphStore } from '../store/useGraphStore'
import { INTENT_META } from '../lib/kinds'

/** A slow tint behind the chart: the current mode's colour, warmed to rose after a collision. */
function Atmosphere() {
  const intent = useGraphStore((s) => s.lastResult?.meta?.intent ?? 'analytical')
  const alert = useGraphStore((s) => (s.lastResult?.stats?.contradictions ?? 0) > 0)
  const hex = INTENT_META[intent]?.hex ?? INTENT_META.analytical.hex
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 transition-[background] duration-[1600ms]" style={{ background: `radial-gradient(60% 50% at 55% 40%, ${hex}12, transparent 70%)` }} />
      <div className={`absolute inset-0 bg-[radial-gradient(55%_45%_at_70%_70%,#f43f5e10,transparent_65%)] transition-opacity duration-[1600ms] ${alert ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

export default function DashboardLayout() {
  const { roomId, username, roomReady, needsName, joinRoom } = useRoomSession()
  const [shareOpen, setShareOpen] = useState(false)
  const logbookOpen = useGraphStore((s) => s.ui.logbook)
  const demoMode = useGraphStore((s) => s.demoMode)
  const navigate = useNavigate()
  const { search } = useLocation()

  useHealth()
  useHotkeys({ onFit: () => useGraphStore.getState().fitAll() })

  useEffect(() => {
    if (new URLSearchParams(search).has('demo') && useGraphStore.getState().nodes.length === 0) useGraphStore.getState().loadDemo()
  }, [search])

  const openShare = () => setShareOpen(true)
  const newRoom = () => navigate('/app') // no ?room → useRoomSession mints a fresh one

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="observatory grid h-dvh min-h-[540px] grid-cols-[minmax(0,1fr)] grid-rows-[52px_minmax(0,1fr)] bg-void text-ink outline-none md:grid-rows-[52px_minmax(0,1fr)_28px]"
    >
      <TopBar onShare={openShare} shareDisabled={!roomReady || !username} />
      <div className="relative grid min-h-0 grid-cols-[minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Logbook collapsed={!logbookOpen} />
        <section aria-label="Chart" className="relative isolate min-h-0 min-w-0">
          <Atmosphere />
          <Canvas />
        </section>
        <Inspector />
      </div>
      <StatusBar />

      <CommandPalette onShare={openShare} onNewRoom={newRoom} />
      <ShortcutsSheet />
      <Toasts />
      <NameModal open={needsName && !demoMode} onJoin={joinRoom} />
      <ShareModal open={shareOpen && roomReady && !needsName} onClose={() => setShareOpen(false)} roomId={roomId} url={roomReady ? window.location.href : ''} />
    </main>
  )
}
