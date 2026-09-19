/**
 * Pure helpers that turn a server response into canvas state.
 * Tolerant by design: a contradiction is recognised whether the server says
 * `type: 'contradiction'`, `data.type: 'contradiction'`, `data.gap: true` or `className: 'edge-gap'`.
 */
export const isContradiction = (e) =>
  e?.type === 'contradiction' || e?.data?.type === 'contradiction' || e?.data?.gap === true || e?.className === 'edge-gap'

const SOLID_LABEL = {
  labelStyle: { fill: 'var(--color-muted)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' },
  labelBgStyle: { fill: 'var(--color-void)', fillOpacity: 0.94 },
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 6,
}

export function normalizeEdge(e) {
  const base = { ...e, id: e.id ?? `e_${e.source}__${e.target}` }
  if (isContradiction(e)) {
    return {
      ...base,
      type: 'contradiction', // → ContradictionEdge (registered in Canvas edgeTypes)
      className: 'edge-gap', // → CSS fallback if the custom edge type is ever missing
      data: {
        ...(e.data ?? {}),
        gap: true,
        type: 'contradiction',
        confidence: typeof e.data?.confidence === 'number' ? e.data.confidence : 0.8,
        relation: e.data?.relation ?? (typeof e.label === 'string' && e.label !== 'CONTRADICTION' ? e.label : 'contradicts'),
      },
    }
  }
  return {
    ...SOLID_LABEL,
    ...base,
    type: e.type && e.type !== 'contradiction' ? e.type : 'default',
    className: e.className ?? 'edge-solid',
    data: { gap: false, ...(e.data ?? {}) },
  }
}

export function normalizeNode(n) {
  const data = n.data ?? {}
  return {
    ...n,
    type: n.type ?? 'concept',
    position: n.position ?? { x: 0, y: 0 },
    data: {
      ...data,
      label: data.label ?? n.id,
      kind: data.kind ?? 'Topic',
      weight: typeof data.weight === 'number' ? data.weight : 0.5,
      summary: data.summary ?? '',
      isNew: Boolean(data.isNew),
    },
  }
}

/** Where the server should place the next cluster: just below everything already on the canvas. */
export function computeOrigin(nodes) {
  if (!nodes.length) return { x: 0, y: 0 }
  let minX = Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x)
    maxY = Math.max(maxY, n.position.y + (n.measured?.height ?? 110))
  }
  return { x: Math.round(minX), y: Math.round(maxY + 160) }
}

/**
 * Merge a server response into the current canvas.
 * - new nodes are appended (ids already on canvas are skipped) and flagged `isNew` for the entry animation
 * - edges must point at known nodes; a new contradiction replaces an existing relation on the same pair
 */
export function mergeGraph(current, incoming) {
  const nodeIds = new Set(current.nodes.map((n) => n.id))
  const nodes = current.nodes.map((n) => (n.data?.isNew ? { ...n, data: { ...n.data, isNew: false } } : n))

  for (const raw of incoming.nodes ?? []) {
    const n = normalizeNode(raw)
    if (nodeIds.has(n.id)) continue
    nodeIds.add(n.id)
    nodes.push({ ...n, data: { ...n.data, isNew: true } })
  }

  const edges = [...current.edges]
  const byPair = new Map(edges.map((e, i) => [`${e.source}->${e.target}`, i]))

  for (const raw of incoming.edges ?? []) {
    const e = normalizeEdge(raw)
    if (e.source === e.target || !nodeIds.has(e.source) || !nodeIds.has(e.target)) continue
    const pair = `${e.source}->${e.target}`
    if (byPair.has(pair)) {
      const i = byPair.get(pair)
      if (isContradiction(e) && !isContradiction(edges[i])) edges[i] = { ...e, id: edges[i].id } // upgrade to a collision
      continue
    }
    byPair.set(pair, edges.length)
    edges.push(e)
  }

  return { nodes, edges }
}
