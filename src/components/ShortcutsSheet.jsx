import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'
import { Kbd } from './ui'

const GROUPS = [
  ['Write', [['⌘ ↵', 'Synthesize the entry'], ['Voice', 'Record → Whisper → chart']]],
  ['Navigate', [['F', 'Fit the whole chart'], ['C', 'Next collision'], ['Scroll', 'Pan · ⌘ scroll to zoom'], ['Drag', 'Move an idea']]],
  ['Panels', [['⌘ /', 'Logbook'], ['⌘ I', 'Inspector'], ['⌘ K', 'Command palette'], ['?', 'This sheet'], ['Esc', 'Close']]],
  ['Edit', [['⌫', 'Remove selected idea or link'], ['Drag handle', 'Draw a relation by hand']]],
]

export default function ShortcutsSheet() {
  const open = useGraphStore((s) => s.ui.shortcuts)
  const setShortcuts = useGraphStore((s) => s.setShortcuts)
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="keys" className="scrim fixed inset-0 z-[90] flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setShortcuts(false) }}>
          <motion.div role="dialog" aria-label="Keyboard shortcuts" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[560px] rounded-[4px] border border-hairline bg-void p-6 shadow-[0_30px_80px_-20px_#000]">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Keyboard</p>
                <h2 className="font-display mt-2 text-[26px] font-normal leading-none text-ink">Shortcuts</h2>
              </div>
              <button type="button" onClick={() => setShortcuts(false)} aria-label="Close" className="grid size-8 place-items-center rounded-[3px] text-muted hover:bg-teal/10 hover:text-ink"><X className="size-4" strokeWidth={1.5} /></button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {GROUPS.map(([title, rows]) => (
                <div key={title}>
                  <p className="eyebrow mb-2.5 text-bronze">{title}</p>
                  <ul className="space-y-2">
                    {rows.map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between gap-4 text-[12.5px] text-ink/85">
                        <span>{v}</span><Kbd>{k}</Kbd>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
