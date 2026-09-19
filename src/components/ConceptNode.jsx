import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { kindOf } from '../lib/kinds'
import { useChart } from '../lib/chartContext'
import { pad2 } from './ui'

/**
 * An idea on the chart. Numbered like a plate in an atlas, typed by glyph + colour,
 * with a five-tick relevance meter and its link count. Selected ideas get viewfinder corners.
 */
function ConceptNode({ id, data, selected }) {
  const kind = kindOf(data.kind)
  const { degrees, highlight, colliding } = useChart()
  const degree = degrees.get(id) ?? 0
  const pct = Math.round((data.weight ?? 0.5) * 100)
  const level = Math.max(1, Math.round((data.weight ?? 0.5) * 5))
  const dimmed = highlight.size > 0 && !highlight.has(id)

  return (
    <div
      style={{ '--node-accent': kind.hex }}
      title={data.summary ? `${data.summary}\nrelevance ${pct}%` : `relevance ${pct}%`}
      className={`idea-node px-3.5 pb-3 pt-2.5 ${selected ? 'is-selected' : ''} ${highlight.has(id) ? 'is-highlighted' : ''} ${dimmed ? 'is-dimmed' : ''} ${colliding.has(id) ? 'is-colliding' : ''} ${data.isNew ? 'animate-node-in' : ''}`}
    >
      <span className="corner corner-tl" aria-hidden="true" />
      <span className="corner corner-tr" aria-hidden="true" />
      <span className="corner corner-bl" aria-hidden="true" />
      <span className="corner corner-br" aria-hidden="true" />
      <Handle type="target" position={Position.Left} />

      <div className="flex items-center gap-2 readout text-muted">
        <span className="w-3 text-center text-[11px] leading-none" style={{ color: kind.hex }} aria-hidden="true">{kind.glyph}</span>
        <span className="text-[9px] uppercase tracking-[0.16em]">{data.kind || 'Note'}</span>
        <span className="ml-auto text-[9px] text-muted/50">№ {pad2(data.no)}</span>
      </div>
      <div className="mt-2 text-[13.5px] font-medium leading-[1.3] tracking-[-0.015em] text-ink [overflow-wrap:anywhere]">{data.label}</div>
      {data.summary && <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.5] text-muted/75">{data.summary}</p>}

      <div className="mt-2.5 flex items-center justify-between">
        <span className="meter" aria-label={`relevance ${pct}%`}>
          {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < level ? 'on' : ''} />)}
        </span>
        <span className="readout text-[9px] text-muted/55">{degree} {degree === 1 ? 'link' : 'links'}</span>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(ConceptNode)
