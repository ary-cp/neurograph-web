import { ArrowRight } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'

const EXAMPLE =
  'Remote work gives people more time to focus, but fewer spontaneous conversations. How can teams protect deep work without losing the chance encounters that lead to new ideas?'

/** Sits bottom-left, out of the way of the rulers; the chart stays interactive behind it. */
export default function EmptyChart() {
  const setInput = useGraphStore((s) => s.setInput)
  const loadDemo = useGraphStore((s) => s.loadDemo)
  const focus = () => document.getElementById('collision-note')?.focus()
  return (
    <div className="pointer-events-none absolute bottom-16 left-7 z-10 max-w-[440px] pr-6 md:left-9">
      <p className="eyebrow">Nothing charted yet</p>
      <h2 className="font-display mt-3 text-[34px] font-light leading-[1.05] text-ink md:text-[40px]">
        <em className="text-bronze">Nothing has collided</em> yet.
      </h2>
      <p className="mt-3 max-w-[330px] text-[13px] leading-[1.75] text-muted/85">
        Write the first entry in the logbook, speak one, or paste a link. The model maps what it reads; the chart shows where your ideas disagree.
      </p>
      <div className="pointer-events-auto mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
        <button type="button" onClick={() => { setInput(EXAMPLE); focus() }} className="inline-flex items-center gap-1.5 border-b border-bronze/40 pb-0.5 text-ink transition-colors hover:border-bronze hover:text-bronze">
          Try an example <ArrowRight className="size-3" aria-hidden="true" />
        </button>
        <button type="button" onClick={loadDemo} className="inline-flex items-center gap-1.5 border-b border-hairline pb-0.5 text-muted transition-colors hover:border-teal hover:text-ink">
          Load the demo constellation <ArrowRight className="size-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
