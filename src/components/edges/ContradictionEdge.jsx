import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import { Zap } from 'lucide-react'
import EdgePulse from './EdgePulse'
import { useChart } from '../../lib/chartContext'

/**
 * Edge type "contradiction" — two claims that cannot both be true.
 * Rose dashed track, a fast pulse, a confidence pill, and a flare when it first lands.
 */
function ContradictionEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, selected, markerStart, markerEnd, interactionWidth, style, pathOptions,
}) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, ...pathOptions })
  const confidence = Math.round((data?.confidence ?? 0) * 100)
  const { flare } = useChart()
  const flaring = flare.has(id)

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
        className="idea-edge-track contradiction-path"
        style={{ ...style, stroke: 'var(--color-collision)', strokeWidth: selected ? 2 : 1.4, strokeOpacity: selected ? 0.95 : 0.55 }}
      />
      <EdgePulse path={path} collision />
      {flaring && (
        <>
          <circle cx={labelX} cy={labelY} r="24" className="collision-flare" />
          <circle cx={labelX} cy={labelY} r="24" className="collision-flare delay" />
        </>
      )}

      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan pointer-events-auto absolute flex items-center gap-1.5 whitespace-nowrap rounded-[3px] border bg-void/95 px-2 py-1 readout text-ink backdrop-blur-md transition-colors duration-200 ${selected ? 'border-collision/80 shadow-[0_0_0_3px_#f43f5e22]' : 'border-collision/35'}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          title={`${data?.relation || 'contradicts'} · confidence ${confidence}%`}
        >
          <Zap className="size-3 shrink-0 text-collision" strokeWidth={1.6} aria-hidden="true" />
          <span className="uppercase tracking-[0.12em]">Collision</span>
          {confidence > 0 && <span className="text-collision">{confidence}%</span>}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(ContradictionEdge)
