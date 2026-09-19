import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, Zap, ArrowRight, ArrowUpRight, Crosshair, Trash2 } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'
import { isContradiction } from '../lib/graphMerge'
import { kindOf } from '../lib/kinds'
import { pad2 } from './ui'
import { updateNode } from '../lib/api'

const TABS = [
  ['idea', 'Idea'],
  ['collisions', 'Collisions'],
  ['sources', 'Sources'],
]

function Meter({ weight = 0.5, hex }) {
  const level = Math.max(1, Math.round(weight * 5))
  return (
    <span className="meter" style={{ '--node-accent': hex }} aria-label={`relevance ${Math.round(weight * 100)}%`}>
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < level ? 'on' : ''} />)}
    </span>
  )
}

function IdeaTab() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectNode = useGraphStore((s) => s.selectNode)
  const focusNodes = useGraphStore((s) => s.focusNodes)
  const removeNode = useGraphStore((s) => s.removeNode)
  const node = nodes.find((n) => n.selected)
  const edge = !node && edges.find((e) => e.selected)
  const byId = new Map(nodes.map((n) => [n.id, n]))

  if (edge) {
    const a = byId.get(edge.source)
    const b = byId.get(edge.target)
    const gap = isContradiction(edge)
    return (
      <div className="px-5 py-5">
        <p className="eyebrow">{gap ? 'Collision' : 'Relation'}</p>
        <div className="mt-4 space-y-3">
          {[a, b].map((n, i) => n && (
            <button key={n.id} type="button" onClick={() => selectNode(n.id)} className="block w-full rounded-[3px] border border-hairline px-3 py-2.5 text-left transition-colors hover:border-teal/60">
              <span className="readout text-muted/60">{i === 0 ? 'from' : 'to'} · {n.data?.kind}</span>
              <span className="mt-1 block text-[13px] font-medium text-ink">{n.data?.label}</span>
            </button>
          ))}
        </div>
        <p className={`mt-4 flex items-center gap-2 readout ${gap ? 'text-collision' : 'text-muted'}`}>
          {gap && <Zap className="size-3" aria-hidden="true" />}
          {edge.data?.relation ?? edge.label ?? 'relates to'} · {Math.round((edge.data?.confidence ?? 0) * 100)}% confidence
        </p>
        {gap && <p className="mt-3 text-[12px] leading-[1.7] text-muted/80">Two claims that cannot both be true. Add evidence for either side and the chart will tell you which one moved.</p>}
      </div>
    )
  }

  if (!node) {
    return (
      <div className="px-5 py-6 text-[12.5px] leading-[1.7] text-muted/75">
        Select an idea on the chart to read it here — its summary, relevance, and everything it is linked to.
      </div>
    )
  }

  const kind = kindOf(node.data?.kind)
  const links = edges.filter((e) => e.source === node.id || e.target === node.id)
  const neighbours = links.map((e) => (e.source === node.id ? e.target : e.source))

  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-2 readout text-muted">
        <span style={{ color: kind.hex }} className="text-[12px]" aria-hidden="true">{kind.glyph}</span>
        <span className="uppercase tracking-[0.16em]">{node.data?.kind}</span>
        <span className="ml-auto text-muted/50">№ {pad2(node.data?.no)}</span>
      </div>
      <h3 className="font-display mt-3 text-[24px] font-normal leading-[1.15] text-ink">{node.data?.label}</h3>
      {node.data?.summary && <p className="mt-3 text-[12.5px] leading-[1.7] text-muted/85">{node.data.summary}</p>}
      <div className="mt-4 flex items-center justify-between border-y border-hairline py-2.5 readout text-muted/70">
        <span className="flex items-center gap-2">relevance <Meter weight={node.data?.weight} hex={kind.hex} /></span>
        <span>{links.length} {links.length === 1 ? 'link' : 'links'}</span>
      </div>

      <p className="eyebrow mt-5">Connected to</p>
      <ul className="mt-2 space-y-1">
        {links.length === 0 && <li className="text-[12px] text-muted/60">Nothing yet — an island.</li>}
        {links.map((e) => {
          const out = e.source === node.id
          const other = byId.get(out ? e.target : e.source)
          const gap = isContradiction(e)
          return (
            <li key={e.id}>
              <button type="button" onClick={() => other && selectNode(other.id)} className="group flex w-full items-center gap-2 rounded-[3px] px-1.5 py-1.5 text-left transition-colors hover:bg-teal/[0.08]">
                <span className={`readout w-[106px] shrink-0 truncate ${gap ? 'text-collision' : 'text-muted/70'}`}>
                  {gap ? <Zap className="mr-1 inline size-2.5" aria-hidden="true" /> : null}
                  {out ? '' : '← '}{e.data?.relation ?? e.label ?? 'relates to'}{out ? ' →' : ''}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink/90 group-hover:text-ink">{other?.data?.label ?? '?'}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 border-t border-hairline pt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted">Sticky Note</span>
          {node.data.stickyNoteAuthor && (
            <span className="text-[9px] text-muted/60">{node.data.stickyNoteAuthor} added this</span>
          )}
        </div>
        <textarea
          className="w-full rounded-[3px] border border-hairline bg-teal/5 p-2 text-[12px] text-ink outline-none transition-colors placeholder:text-muted/40 focus:border-teal/50 focus:bg-teal/10"
          placeholder="Add a manual sticky note for this idea..."
          rows={3}
          defaultValue={node.data.stickyNote || ''}
          onChange={(e) => {
            const username = useGraphStore.getState().username || 'someone'
            const value = e.target.value
            
            // 1. Update local state immediately for instant feedback
            useGraphStore.getState().updateNodeData(node.id, { 
              stickyNote: value,
              stickyNoteAuthor: value ? username : null
            })
            
            // 2. Debounced API call to sync across the room
            if (window._stickyNoteTimer) clearTimeout(window._stickyNoteTimer)
            window._stickyNoteTimer = setTimeout(() => {
              const roomId = useGraphStore.getState().roomId
              if (!roomId) return // Only sync if in a multiplayer room
              
              const updatedNode = useGraphStore.getState().nodes.find(n => n.id === node.id)
              if (!updatedNode) return
              
              updateNode(roomId, updatedNode).catch(err => console.error('Failed to sync sticky note:', err))
            }, 1500) // 1.5s delay after they stop typing
          }}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => focusNodes([node.id, ...neighbours])} className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[3px] border border-hairline text-[11.5px] text-ink transition-colors hover:border-teal/60 hover:bg-teal/10">
          <Crosshair className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> Focus neighbourhood
        </button>
        <button type="button" onClick={() => removeNode(node.id)} title="Remove from the chart (not from the room history)" className="grid size-8 place-items-center rounded-[3px] border border-hairline text-muted transition-colors hover:border-collision/60 hover:text-collision">
          <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function CollisionsTab() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectEdge = useGraphStore((s) => s.selectEdge)
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const collisions = edges.filter(isContradiction)
  if (!collisions.length) {
    return <div className="px-5 py-6 text-[12.5px] leading-[1.7] text-muted/75">No collisions yet. That is either agreement or silence — add a note that disagrees with one already on the chart.</div>
  }
  return (
    <ul className="px-3 py-3">
      {collisions.map((e, i) => (
        <li key={e.id}>
          <button type="button" onClick={() => selectEdge(e.id)} className={`w-full rounded-[3px] px-2 py-3 text-left transition-colors hover:bg-collision/[0.06] ${e.selected ? 'bg-collision/[0.08]' : ''}`}>
            <div className="flex items-center gap-2 readout text-muted/60">
              <span className="text-collision">⚡ {pad2(i + 1)}</span>
              <span>{Math.round((e.data?.confidence ?? 0) * 100)}% confidence</span>
              <ArrowRight className="ml-auto size-3 text-muted/40" aria-hidden="true" />
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink/90">{byId.get(e.source)?.data?.label ?? e.source}</p>
            <p className="readout my-0.5 text-collision/80">{e.data?.relation ?? 'contradicts'}</p>
            <p className="text-[12.5px] leading-[1.5] text-ink/90">{byId.get(e.target)?.data?.label ?? e.target}</p>
          </button>
        </li>
      ))}
    </ul>
  )
}

function SourcesTab() {
  const entries = useGraphStore((s) => s.entries)
  const sources = entries.flatMap((e) => (e.research ?? []).map((r) => ({ ...r, entry: e })))
  if (!sources.length) {
    return <div className="px-5 py-6 text-[12.5px] leading-[1.7] text-muted/75">Paste a link in an entry and it is read live before the model sees it. Sources land here.</div>
  }
  return (
    <ul className="px-3 py-3 space-y-1">
      {sources.map((r, i) => (
        <li key={`${r.url}-${i}`} className="rounded-[3px] px-2 py-2.5">
          <div className={`flex items-center gap-2 readout ${r.ok ? 'text-sage' : 'text-collision'}`}>
            <span>{r.ok ? '✓ read' : '✗ failed'}</span>
            {r.ok && r.chars && <span className="text-muted/50">{Math.round(r.chars / 1000)}k chars{r.truncated ? ' · truncated' : ''}</span>}
          </div>
          <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-start gap-1.5 text-[12.5px] leading-[1.5] text-ink/90 hover:text-bronze">
            <span className="line-clamp-2">{r.title ?? r.url}</span>
            <ArrowUpRight className="mt-1 size-3 shrink-0" aria-hidden="true" />
          </a>
          {!r.ok && r.error && <p className="mt-1 readout text-muted/60">{r.error}</p>}
          <p className="mt-1 readout text-muted/50">entry by {r.entry.author}</p>
        </li>
      ))}
    </ul>
  )
}

export default function Inspector() {
  const open = useGraphStore((s) => s.ui.inspector)
  const tab = useGraphStore((s) => s.ui.inspectorTab)
  const setInspector = useGraphStore((s) => s.setInspector)
  const collisions = useGraphStore((s) => s.edges.filter(isContradiction).length)
  const sources = useGraphStore((s) => s.entries.reduce((n, e) => n + (e.research?.length ?? 0), 0))
  const reduce = useReducedMotion()
  const counts = { idea: null, collisions, sources }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="inspector"
          aria-label="Inspector"
          initial={reduce ? false : { x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { x: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 flex h-full min-h-0 w-[300px] flex-col border-l border-hairline bg-surface/40 backdrop-blur-sm max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:w-[min(100%,320px)] max-md:bg-void/95"
        >
          <div className="flex items-center border-b border-hairline pl-2 pr-1">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setInspector(true, id)}
                className={`relative h-10 px-3 text-[11.5px] transition-colors ${tab === id ? 'text-ink' : 'text-muted/70 hover:text-ink'}`}
              >
                {label}
                {counts[id] > 0 && <span className={`ml-1.5 readout ${id === 'collisions' ? 'text-collision' : 'text-sage'}`}>{counts[id]}</span>}
                {tab === id && <motion.span layoutId="inspector-tab" className="absolute inset-x-3 bottom-0 h-px bg-bronze" />}
              </button>
            ))}
            <button type="button" onClick={() => setInspector(false)} aria-label="Close inspector (Esc)" className="ml-auto grid size-8 place-items-center rounded-[3px] text-muted hover:bg-teal/10 hover:text-ink">
              <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'idea' && <IdeaTab />}
            {tab === 'collisions' && <CollisionsTab />}
            {tab === 'sources' && <SourcesTab />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
