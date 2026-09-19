import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'
import { Kbd } from './ui'

export default function CommandPalette({ onShare, onNewRoom }) {
  const open = useGraphStore((s) => s.ui.palette)
  const setPalette = useGraphStore((s) => s.setPalette)
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef(null)

  const commands = useMemo(() => {
    const s = () => useGraphStore.getState()
    return [
      { id: 'synth', label: 'Synthesize the current entry', kbd: '⌘↵', run: () => s().synthesize() },
      { id: 'collision', label: 'Jump to next collision', kbd: 'C', run: () => s().nextCollision() },
      { id: 'fit', label: 'Fit the whole chart', kbd: 'F', run: () => s().fitAll() },
      { id: 'logbook', label: 'Toggle logbook', kbd: '⌘/', run: () => s().toggleLogbook() },
      { id: 'inspector', label: 'Toggle inspector', kbd: '⌘I', run: () => s().toggleInspector() },
      { id: 'sources', label: 'Open sources panel', run: () => s().setInspector(true, 'sources') },
      { id: 'share', label: 'Share this room (QR + link)', run: onShare },
      { id: 'copy', label: 'Copy room link', run: () => navigator.clipboard?.writeText(window.location.href).then(() => s().pushToast({ title: 'Room link copied' })) },
      { id: 'new', label: 'Start a new room', run: onNewRoom },
      { id: 'export', label: 'Export chart as JSON', run: () => s().exportGraph() },
      { id: 'demo', label: 'Load the demo constellation', run: () => s().loadDemo() },
      { id: 'clear', label: 'Clear the chart', run: () => s().clearGraph() },
      { id: 'keys', label: 'Keyboard shortcuts', kbd: '?', run: () => s().setShortcuts(true) },
    ]
  }, [onShare, onNewRoom])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? commands.filter((c) => c.label.toLowerCase().includes(t)) : commands
  }, [q, commands])

  useEffect(() => {
    if (open) { setQ(''); setI(0); setTimeout(() => inputRef.current?.focus(), 10) }
  }, [open])
  useEffect(() => setI(0), [q])

  const run = (c) => { setPalette(false); setTimeout(() => c.run?.(), 0) }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)) }
    else if (e.key === 'Enter' && results[i]) { e.preventDefault(); run(results[i]) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="palette" className="scrim fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setPalette(false) }}>
          <motion.div
            role="dialog" aria-label="Command palette"
            initial={{ y: -8, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -6, scale: 0.98, opacity: 0 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[520px] overflow-hidden rounded-[4px] border border-hairline bg-void shadow-[0_30px_80px_-20px_#000]"
          >
            <div className="flex items-center gap-3 border-b border-hairline px-4">
              <Search className="size-4 text-teal" strokeWidth={1.5} aria-hidden="true" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Type a command…" className="h-12 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted/50 focus-visible:outline-none" />
              <Kbd>esc</Kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto py-1.5">
              {results.length === 0 && <li className="px-4 py-3 text-[12.5px] text-muted/70">Nothing matches.</li>}
              {results.map((c, idx) => (
                <li key={c.id}>
                  <button type="button" onMouseEnter={() => setI(idx)} onClick={() => run(c)} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors ${idx === i ? 'bg-teal/[0.10] text-ink' : 'text-ink/80'}`}>
                    <span>{c.label}</span>
                    {c.kbd && <Kbd>{c.kbd}</Kbd>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 border-t border-hairline px-4 py-2 readout text-muted/50">
              <span><Kbd>↑↓</Kbd> move</span><span><Kbd>↵</Kbd> run</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
