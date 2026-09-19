import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import { extractGraph, getRoomGraph, ApiError } from '../lib/api'
import { normalizeEdge, normalizeNode, mergeGraph, computeOrigin, isContradiction } from '../lib/graphMerge'
import { normalizeUsername, readSavedUsername, saveUsername } from '../lib/collaboration'
import { DEMO_GRAPH, DEMO_ENTRIES } from '../data/demoConstellation'

const AUTHOR_RE = /^\[(.+?)\]:\s*/
const POLL_MS = 3000
let toastSeq = 0

/** Every idea gets a stable chart number (№ 01, 02 …) the first time it lands on the canvas. */
function renumber(nodes) {
  let next = nodes.reduce((m, n) => Math.max(m, n.data?.no ?? 0), 0)
  return nodes.map((n) => (n.data?.no ? n : { ...n, data: { ...n.data, no: ++next } }))
}

/** A persisted room note → a logbook entry (author is the "[name]: " prefix synthesize() writes). */
function entryFromNote(note, local) {
  const content = String(note.content ?? '')
  const m = AUTHOR_RE.exec(content)
  const g = note.graph ?? {}
  const edges = g.edges ?? []
  return {
    id: note.id,
    at: new Date(note.created_at).getTime() || Date.now(),
    author: m?.[1] ?? 'Someone',
    text: m ? content.slice(m[0].length) : content,
    nodeIds: (g.nodes ?? []).map((n) => n.id),
    stats: { nodes: (g.nodes ?? []).length, edges: edges.length, contradictions: edges.filter(isContradiction).length },
    intent: local?.intent,
    research: local?.research,
    meta: local?.meta,
  }
}

export const useGraphStore = create((set, get) => ({
  // ── graph ─────────────────────────────────────────────
  nodes: [],
  edges: [],
  input: '',
  isSynthesizing: false,
  error: null,
  lastResult: null, // { stats, meta, at }
  fitVersion: 0,
  recentNodeIds: null,
  highlightIds: [], // hovered logbook entry → nodes it created
  flareIds: [], // contradiction edges that just landed (flare animation)

  // ── room / identity ───────────────────────────────────
  roomId: null,
  username: readSavedUsername(),
  roomVersion: 0,
  roomSnapshots: {},
  roomNotesCount: 0,
  entries: [], // logbook, newest first
  demoMode: false,

  // ── ui ────────────────────────────────────────────────
  ui: { logbook: typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches, inspector: false, inspectorTab: 'idea', palette: false, shortcuts: false }, // phones start on the chart
  toasts: [],
  health: { status: 'checking', model: null, whisper: null },

  setUsername: (value) => {
    const username = normalizeUsername(value)
    if (!username) return false
    saveUsername(username)
    set({ username, error: null })
    return true
  },

  setRoomId: (value) => {
    const roomId = typeof value === 'string' ? value.trim() : ''
    if (!roomId || roomId === get().roomId) return
    set((state) => {
      if (!state.roomId) return { roomId, roomVersion: state.roomVersion + 1 }
      const roomSnapshots = {
        ...state.roomSnapshots,
        [state.roomId]: {
          nodes: state.nodes, edges: state.edges, input: state.input,
          lastResult: state.lastResult, recentNodeIds: state.recentNodeIds, entries: state.entries,
        },
      }
      const saved = Object.hasOwn(roomSnapshots, roomId) ? roomSnapshots[roomId] : null
      return {
        roomId, roomSnapshots,
        roomVersion: state.roomVersion + 1,
        nodes: saved?.nodes ?? [], edges: saved?.edges ?? [], input: saved?.input ?? '',
        lastResult: saved?.lastResult ?? null, recentNodeIds: saved?.recentNodeIds ?? null,
        entries: saved?.entries ?? [], highlightIds: [], flareIds: [],
        fitVersion: state.fitVersion + 1, isSynthesizing: false, error: null, roomNotesCount: 0,
      }
    })
    if (get().demoMode) return

    get().fetchRoomGraphs()
    // Hackathon "multiplayer": short polling. A realtime channel can replace this later.
    if (window._roomSyncInterval) clearInterval(window._roomSyncInterval)
    window._roomSyncInterval = setInterval(() => {
      if (get().roomId === roomId && !get().demoMode) get().fetchRoomGraphs(true)
    }, POLL_MS)
  },

  fetchRoomGraphs: async (isPolling = false) => {
    const { roomId, roomVersion, roomNotesCount, demoMode } = get()
    if (!roomId || demoMode) return
    try {
      const res = await getRoomGraph(roomId, { layout: 'stored' })
      if (!res.ok || !res.notes) return
      const isCurrentRoom = () => get().roomId === roomId && get().roomVersion === roomVersion && !get().demoMode
      if (!isCurrentRoom()) return
      if (isPolling && res.notes.length === roomNotesCount) return

      let nodes = []
      let edges = []
      for (const note of res.notes) {
        const merged = mergeGraph({ nodes, edges }, note.graph)
        nodes = merged.nodes
        edges = merged.edges
      }
      const localById = new Map(get().entries.map((e) => [e.id, e]))
      const entries = res.notes.map((note) => entryFromNote(note, localById.get(note.id))).sort((a, b) => b.at - a.at)

      set({
        nodes: renumber(nodes.map((n) => ({ ...n, data: { ...n.data, isNew: false } }))),
        edges,
        entries,
        roomNotesCount: res.notes.length,
        fitVersion: isPolling ? get().fitVersion : get().fitVersion + 1,
      })
    } catch (err) {
      console.error('Failed to fetch room graphs', err)
    }
  },

  setInput: (input) => set({ input, error: null }),
  dismissError: () => set({ error: null }),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(normalizeEdge({ ...connection, label: 'relates to' }), get().edges) }),

  clearGraph: () => {
    set((s) => ({
      nodes: [], edges: [], entries: s.demoMode ? [] : s.entries, lastResult: null, recentNodeIds: null,
      highlightIds: [], flareIds: [], error: null, isSynthesizing: false, roomVersion: s.roomVersion + 1,
    }))
    get().pushToast({ title: 'Chart cleared', detail: 'Room history is untouched — reload to bring it back.' })
  },

  synthesize: async () => {
    const { input, username, roomId, roomVersion, nodes, isSynthesizing, demoMode } = get()
    const text = input.trim()
    if (!text || isSynthesizing) return
    if (!roomId || !username) {
      set({ error: 'Enter your name and join a room before synthesizing.' })
      return
    }
    set({ isSynthesizing: true, error: null })
    const isCurrentRoom = () => get().roomId === roomId && get().roomVersion === roomVersion

    try {
      const existingNodes = nodes.map((n) => ({ id: n.id, label: n.data?.label ?? n.id, kind: n.data?.kind ?? 'Topic' }))
      const res = await extractGraph({
        text: `[${username}]: ${text}`,
        room_id: roomId,
        existingNodes,
        origin: computeOrigin(nodes),
        persist: !demoMode,
      })
      if (!isCurrentRoom()) return
      const current = get()
      const prevEdgeIds = new Set(current.edges.map((e) => e.id))
      const merged = mergeGraph({ nodes: current.nodes, edges: current.edges }, res)
      const nodeIds = (res.nodes ?? []).map((n) => n.id)
      const flareIds = merged.edges.filter((e) => isContradiction(e) && !prevEdgeIds.has(e.id)).map((e) => e.id)
      const entry = {
        id: res.meta?.noteId ?? `local-${Date.now()}`,
        at: Date.now(), author: username, text,
        nodeIds, stats: res.stats, intent: res.meta?.intent, research: res.meta?.research, meta: res.meta,
      }

      set({
        nodes: renumber(merged.nodes),
        edges: merged.edges,
        input: current.input === input ? '' : current.input,
        lastResult: { stats: res.stats, meta: res.meta, at: Date.now() },
        fitVersion: get().fitVersion + 1,
        recentNodeIds: nodeIds,
        flareIds,
        entries: [entry, ...current.entries.filter((e) => e.id !== entry.id)],
      })
      if (flareIds.length) setTimeout(() => set({ flareIds: [] }), 3200)

      const c = res.stats?.contradictions ?? 0
      get().pushToast({
        title: c ? `${c} ${c === 1 ? 'collision' : 'collisions'} detected` : `Entry № ${current.entries.length + 1} charted`,
        detail: `+${res.stats?.nodes ?? 0} ideas · +${res.stats?.edges ?? 0} links · ${res.meta?.intent ?? 'analytical'}${res.meta?.research?.length ? ` · ${res.meta.research.filter((r) => r.ok).length}/${res.meta.research.length} sources` : ''}`,
        tone: c ? 'collision' : 'default',
      })
      if (c) set((s) => ({ ui: { ...s.ui, inspector: true, inspectorTab: 'collisions' } }))
    } catch (err) {
      console.error('[synthesize]', err)
      if (isCurrentRoom()) set({ error: err instanceof ApiError ? err.message : 'Something went wrong while synthesizing.' })
    } finally {
      if (isCurrentRoom()) set({ isSynthesizing: false })
    }
  },

  // ── ui actions ────────────────────────────────────────
  toggleLogbook: () => set((s) => ({ ui: { ...s.ui, logbook: !s.ui.logbook } })),
  setInspector: (open, tab) => set((s) => ({ ui: { ...s.ui, inspector: open, inspectorTab: tab ?? s.ui.inspectorTab } })),
  toggleInspector: () => set((s) => ({ ui: { ...s.ui, inspector: !s.ui.inspector } })),
  setPalette: (open) => set((s) => ({ ui: { ...s.ui, palette: open, shortcuts: open ? false : s.ui.shortcuts } })),
  setShortcuts: (open) => set((s) => ({ ui: { ...s.ui, shortcuts: open, palette: open ? false : s.ui.palette } })),

  pushToast: ({ title, detail, tone = 'default', ttl = 4200 }) => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, title, detail, tone }] }))
    setTimeout(() => get().dismissToast(id), ttl)
    return id
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setHighlight: (ids) => set({ highlightIds: ids ?? [] }),

  fitAll: () => set((s) => ({ recentNodeIds: null, fitVersion: s.fitVersion + 1 })),

  /** Camera to a set of ideas (logbook entry click, inspector jumps). */
  focusNodes: (ids) => {
    if (!ids?.length) return
    set((s) => ({ recentNodeIds: ids, fitVersion: s.fitVersion + 1 }))
  },

  selectNode: (id, { focus = true } = {}) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (Boolean(n.selected) === (n.id === id) ? n : { ...n, selected: n.id === id })),
      edges: s.edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
      ui: { ...s.ui, inspector: true, inspectorTab: 'idea' },
    }))
    if (focus) get().focusNodes([id])
  },

  selectEdge: (id) => {
    const edge = get().edges.find((e) => e.id === id)
    if (!edge) return
    set((s) => ({
      edges: s.edges.map((e) => (Boolean(e.selected) === (e.id === id) ? e : { ...e, selected: e.id === id })),
      nodes: s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
      ui: { ...s.ui, inspector: true, inspectorTab: 'idea' },
    }))
    get().focusNodes([edge.source, edge.target])
  },

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  /** Cycle through collisions (keyboard "c"). */
  nextCollision: () => {
    const { edges } = get()
    const collisions = edges.filter(isContradiction)
    if (!collisions.length) {
      get().pushToast({ title: 'No collisions on the chart', detail: 'Add a note that disagrees with one already here.' })
      return
    }
    const selectedAt = collisions.findIndex((e) => e.selected)
    const next = collisions[(selectedAt + 1) % collisions.length]
    get().selectEdge(next.id)
    set((s) => ({ ui: { ...s.ui, inspectorTab: 'collisions' } }))
  },

  setHealth: (health) => set({ health }),

  loadDemo: () => {
    if (window._roomSyncInterval) clearInterval(window._roomSyncInterval)
    set((s) => ({
      demoMode: true,
      nodes: renumber(DEMO_GRAPH.nodes.map(normalizeNode)),
      edges: DEMO_GRAPH.edges.map(normalizeEdge),
      entries: [...DEMO_ENTRIES].sort((a, b) => b.at - a.at),
      lastResult: { stats: DEMO_ENTRIES[2].stats, meta: { ...DEMO_ENTRIES[2].meta, intent: 'brainstorm', mock: true }, at: Date.now() },
      recentNodeIds: null, highlightIds: [], flareIds: [], error: null, isSynthesizing: false,
      fitVersion: s.fitVersion + 1,
    }))
    get().pushToast({ title: 'Demo constellation loaded', detail: 'A sandbox — nothing here is saved to the room.' })
  },

  exportGraph: () => {
    const { nodes, edges, entries, roomId } = get()
    const payload = { exportedAt: new Date().toISOString(), room: roomId, nodes, edges, entries }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `neurograph-${roomId ?? 'chart'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    get().pushToast({ title: 'Chart exported', detail: `${nodes.length} ideas · ${edges.length} links · JSON` })
  },
}))
