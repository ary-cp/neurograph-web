import { memo } from 'react'
import { BaseEdge, EdgeText, getBezierPath, getSimpleBezierPath, getSmoothStepPath, getStraightPath } from '@xyflow/react'
import EdgePulse from './EdgePulse'

/** Keep each built-in geometry while giving every relation the same flowing ink. */
function RelationEdge({
  id, type, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  selected, style, markerStart, markerEnd, interactionWidth,
  label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius,
  pathOptions,
}) {
  const points = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }
  const [path, labelX, labelY] = type === 'straight'
    ? getStraightPath(points)
    : type === 'step' || type === 'smoothstep'
      ? getSmoothStepPath({ ...points, ...pathOptions, ...(type === 'step' ? { borderRadius: 0 } : {}) })
      : type === 'simplebezier'
        ? getSimpleBezierPath(points)
        : getBezierPath({ ...points, ...pathOptions })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
        className="idea-edge-track"
        style={{ ...style, stroke: 'var(--color-ocean)', strokeWidth: selected ? 2 : 1.4, strokeOpacity: selected ? 1 : 0.55 }}
      />
      <EdgePulse path={path} />
      {label != null && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={label}
          labelStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', ...labelStyle, fill: 'var(--color-muted)' }}
          labelShowBg={labelShowBg}
          labelBgStyle={{ ...labelBgStyle, fill: 'var(--color-void)', fillOpacity: 0.94 }}
          labelBgPadding={labelBgPadding ?? [6, 3]}
          labelBgBorderRadius={labelBgBorderRadius ?? 4}
        />
      )}
    </>
  )
}

export default memo(RelationEdge)
