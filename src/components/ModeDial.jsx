import { motion } from 'framer-motion'
import { useGraphStore } from '../store/useGraphStore'
import { INTENT_META } from '../lib/kinds'

const MODES = ['analytical', 'brainstorm', 'research']

/**
 * Auto-mode readout. The model deduces the intent while it reads; the needle swings to it.
 * Nothing here is clickable on purpose — the mode is an observation, not a setting.
 */
export default function ModeDial() {
  const intent = useGraphStore((s) => s.lastResult?.meta?.intent ?? 'analytical')
  const reading = useGraphStore((s) => s.isSynthesizing)
  const active = INTENT_META[intent] ?? INTENT_META.analytical

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title="The model picks the mode from what you write: facts → analytical, questions → brainstorm, links → research"
      className="relative hidden h-8 items-center rounded-[3px] border border-hairline bg-surface/70 pl-2.5 pr-1.5 md:flex"
    >
      <span className="sr-only">Active mode: {active.label}</span>
      <span className="eyebrow mr-1 text-muted/55">Mode</span>
      {MODES.map((m) => {
        const on = m === intent
        return (
          <span
            key={m}
            className="dial-tick relative px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] leading-8"
            style={{ color: on ? INTENT_META[m].hex : 'var(--color-muted)', opacity: on ? 1 : 0.4 }}
          >
            {INTENT_META[m].label}
            {on && (
              <motion.span
                layoutId="dial-needle"
                aria-hidden="true"
                className="absolute inset-x-2 bottom-0 h-px"
                style={{ background: INTENT_META[m].hex, boxShadow: `0 0 8px ${INTENT_META[m].hex}` }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
          </span>
        )
      })}
      <span className={`eyebrow ml-1 rounded-[2px] px-1.5 py-0.5 ${reading ? 'rec-dot text-bronze' : 'text-bronze/80'}`}>{reading ? 'reading' : 'auto'}</span>
    </div>
  )
}
