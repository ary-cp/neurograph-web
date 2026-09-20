import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, MiniMap, Panel,
  useReactFlow, useNodesInitialized, useViewport, useStore,
} from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { Minus, Plus, Maximize2, Zap } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'
import { isContradiction } from '../lib/graphMerge'
import { kindOf } from '../lib/kinds'
import { ChartContext } from '../lib/chartContext'
import ConceptNode from './ConceptNode'
import ContradictionEdge from './edges/ContradictionEdge'
import RelationEdge from './edges/RelationEdge'
import EmptyChart from './EmptyChart'

const nodeTypes = { concept: ConceptNode }
const edgeTypes = {
  default: RelationEdge, straight: RelationEdge, step: RelationEdge, smoothstep: RelationEdge, simplebezier: RelationEdge,
  contradiction: ContradictionEdge,
}

const selector = (s) => ({
  nodes: s.nodes, edges: s.edges,
  onNodesChange: s.onNodesChange, onEdgesChange: s.onEdgesChange, onConnect: s.onConnect,
})

/** Camera to freshly synthesized ideas (or everything) once React Flow has measured them. */
function ViewportSync() {
  const fitVersion = useGraphStore((s) => s.fitVersion)
  const recentNodeIds = useGraphStore((s) => s.recentNodeIds)
  const initialized = useNodesInitialized()
  const { fitView } = useReactFlow()
  const done = useRef(0)
  useEffect(() => {
    if (initialized && fitVersion !== done.current) {
      done.current = fitVersion
      const nodes = recentNodeIds?.length ? recentNodeIds.map((id) => ({ id })) : undefined
      setTimeout(() => {
        fitView({ nodes, duration: 700, padding: 0.3, maxZoom: 1.15 })
      }, 150) // Wait for mobile keyboard to retract and canvas to remeasure
    }
  }, [fitVersion, recentNodeIds, initialized, fitView])
  return null
}

/** If the selected idea is off-screen or under the inspector's edge, pan (never zoom) to bring it in. */
function SelectionPan() {
  const selectedId = useGraphStore((s) => s.nodes.find((n) => n.selected)?.id ?? null)
  const inspector = useGraphStore((s) => s.ui.inspector)
  const { getNode, flowToScreenPosition, setCenter, getZoom } = useReactFlow()
  const domNode = useStore((s) => s.domNode)
  useEffect(() => {
    if (!selectedId || !domNode) return
    const t = setTimeout(() => {
      const node = getNode(selectedId)
      if (!node) return
      const rect = domNode.getBoundingClientRect()
      const zoom = getZoom()
      const w = (node.measured?.width ?? 212) * zoom
      const h = (node.measured?.height ?? 110) * zoom
      const tl = flowToScreenPosition(node.position)
      const pad = 28
      const visible = tl.x >= rect.left + pad && tl.x + w <= rect.right - pad && tl.y >= rect.top + pad && tl.y + h <= rect.bottom - pad
      if (!visible) setCenter(node.position.x + w / zoom / 2, node.position.y + h / zoom / 2, { zoom, duration: 480 })
    }, 60) // after the inspector column has taken its width
    return () => clearTimeout(t)
  }, [selectedId, inspector, domNode, getNode, flowToScreenPosition, setCenter, getZoom])
  return null
}

/** Chart rulers: graph-unit ticks along the top and left edges, like a plate in an atlas. */
function ChartRulers() {
  const { x, y, zoom } = useViewport()
  const [width, height] = useStore(useShallow((s) => [s.width, s.height]))
  const step = [50, 100, 200, 500, 1000, 2000, 5000].find((st) => st * zoom >= 56) ?? 10000
  const ticks = (offset, size) => {
    const out = []
    const start = Math.floor(-offset / zoom / step) * step
    const end = (size - offset) / zoom
    for (let g = start; g <= end; g += step) out.push({ g, s: g * zoom + offset, major: g % (step * 5) === 0 })
    return out
  }
  if (!width || !height) return null
  return (
    <svg className="ruler pointer-events-none absolute inset-0 z-[4]" width={width} height={height} aria-hidden="true">
      <line x1="0" x2={width} y1="0.5" y2="0.5" />
      <line y1="0" y2={height} x1="0.5" x2="0.5" />
      {ticks(x, width).map(({ g, s, major }) => (
        <g key={`x${g}`}>
          <line x1={s} x2={s} y1="0" y2={major ? 10 : 5} />
          {major && <text x={s + 4} y={17}>{g}</text>}
        </g>
      ))}
      {ticks(y, height).map(({ g, s, major }) => (
        <g key={`y${g}`}>
          <line y1={s} y2={s} x1="0" x2={major ? 10 : 5} />
          {major && <text x={13} y={s - 4}>{g}</text>}
        </g>
      ))}
    </svg>
  )
}

/** Cursor position in graph units + a headcount. */
function ChartReadout({ counts }) {
  const { screenToFlowPosition } = useReactFlow()
  const domNode = useStore((s) => s.domNode)
  const { zoom } = useViewport()
  const [pos, setPos] = useState(null)
  useEffect(() => {
    if (!domNode) return
    let raf = 0
    const move = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setPos(screenToFlowPosition({ x: e.clientX, y: e.clientY })))
    }
    const leave = () => setPos(null)
    domNode.addEventListener('mousemove', move)
    domNode.addEventListener('mouseleave', leave)
    return () => { cancelAnimationFrame(raf); domNode.removeEventListener('mousemove', move); domNode.removeEventListener('mouseleave', leave) }
  }, [domNode, screenToFlowPosition])
  return (
    <Panel position="bottom-left" className="!m-0 !bottom-3 !left-4 flex items-center gap-3 readout text-muted/60">
      <span className="w-[150px] whitespace-nowrap tabular-nums">
        {pos ? `x ${Math.round(pos.x)} · y ${Math.round(pos.y)}` : 'x — · y —'} · ×{zoom.toFixed(2)}
      </span>
      <span aria-hidden="true" className="hidden h-3 border-l border-hairline sm:inline" />
      <span className="hidden sm:inline">{counts.nodes} ideas · {counts.edges} links · <span className={counts.collisions ? 'text-collision' : ''}>{counts.collisions} {counts.collisions === 1 ? 'collision' : 'collisions'}</span></span>
    </Panel>
  )
}

/** Brass instrument strip, bottom-right. */
function ChartControls({ collisions }) {
  const { zoomIn, zoomOut } = useReactFlow()
  const fitAll = useGraphStore((s) => s.fitAll)
  const nextCollision = useGraphStore((s) => s.nextCollision)
  const btn = 'grid h-8 min-w-8 place-items-center px-2 text-muted transition-colors hover:bg-teal/10 hover:text-ink'
  return (
    <Panel position="bottom-right" className="!m-0 !bottom-3 !right-4 flex divide-x divide-hairline overflow-hidden rounded-[3px] border border-hairline bg-void/90 backdrop-blur-sm">
      <button type="button" className={btn} onClick={() => zoomOut({ duration: 200 })} title="Zoom out"><Minus className="size-3.5" strokeWidth={1.5} /></button>
      <button type="button" className={btn} onClick={() => zoomIn({ duration: 200 })} title="Zoom in"><Plus className="size-3.5" strokeWidth={1.5} /></button>
      <button type="button" className={btn} onClick={fitAll} title="Fit the chart (F)"><Maximize2 className="size-3.5" strokeWidth={1.5} /></button>
      <button type="button" className={`${btn} gap-1.5 readout ${collisions ? 'text-collision hover:text-collision' : ''}`} onClick={nextCollision} title="Next collision (C)">
        <Zap className="size-3.5" strokeWidth={1.5} />{collisions}
      </button>
    </Panel>
  )
}

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useGraphStore(useShallow(selector))
  const highlightIds = useGraphStore((s) => s.highlightIds)
  const flareIds = useGraphStore((s) => s.flareIds)
  const setInspector = useGraphStore((s) => s.setInspector)
  const setHighlight = useGraphStore((s) => s.setHighlight)

  const derived = useMemo(() => {
    const degrees = new Map()
    const colliding = new Set()
    let collisions = 0
    for (const e of edges) {
      degrees.set(e.source, (degrees.get(e.source) ?? 0) + 1)
      degrees.set(e.target, (degrees.get(e.target) ?? 0) + 1)
      if (isContradiction(e)) { collisions++; colliding.add(e.source); colliding.add(e.target) }
    }
    return { degrees, colliding, collisions }
  }, [edges])

  const ctx = useMemo(
    () => ({ degrees: derived.degrees, colliding: derived.colliding, highlight: new Set(highlightIds), flare: new Set(flareIds) }),
    [derived, highlightIds, flareIds],
  )
  const counts = { nodes: nodes.length, edges: edges.length, collisions: derived.collisions }

  return (
    <ChartContext.Provider value={ctx}>
      <div className="relative h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={({ nodes: sel, edges: selE }) => { if (sel.length || selE.length) setInspector(true, 'idea') }}
          onNodeMouseEnter={(_, n) => setHighlight([n.id, ...edges.filter((e) => e.source === n.id || e.target === n.id).map((e) => (e.source === n.id ? e.target : e.source))])}
          onNodeMouseLeave={() => setHighlight([])}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
          minZoom={0.15}
          maxZoom={2}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag={false}
          panOnScroll
          zoomOnPinch={true}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={0.8} color="rgba(127,158,157,0.16)" />
          {nodes.length > 0 && <MiniMap position="top-right" pannable zoomable style={{ width: 150, height: 96, top: 14, right: 16 }} nodeColor={(n) => kindOf(n.data?.kind).hex} nodeStrokeWidth={0} />}
          <ChartRulers />
          <ChartReadout counts={counts} />
          <ChartControls collisions={derived.collisions} />
          <ViewportSync />
          <SelectionPan />
        </ReactFlow>
        {nodes.length === 0 && <EmptyChart />}
      </div>
    </ChartContext.Provider>
  )
}
