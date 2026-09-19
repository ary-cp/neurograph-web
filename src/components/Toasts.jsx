import { AnimatePresence, motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'

export default function Toasts() {
  const toasts = useGraphStore((s) => s.toasts)
  const dismiss = useGraphStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -6, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex max-w-[460px] items-start gap-3 rounded-[3px] border bg-void/95 px-3.5 py-2.5 text-left shadow-[0_20px_50px_-20px_#000] backdrop-blur-md ${t.tone === 'collision' ? 'border-collision/50' : 'border-hairline'}`}
          >
            {t.tone === 'collision' && <Zap className="mt-0.5 size-3.5 shrink-0 text-collision" strokeWidth={1.6} aria-hidden="true" />}
            <span>
              <span className="block text-[12.5px] font-medium text-ink">{t.title}</span>
              {t.detail && <span className="mt-0.5 block readout text-muted/75">{t.detail}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
