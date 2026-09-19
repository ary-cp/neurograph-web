// Seed data — same shape the server returns from POST /api/extract-graph.
// Kept so the canvas is never empty on first load (and gives the LLM something to collide with).

export const initialNodes = [
  {
    id: 'remote_work',
    type: 'concept',
    position: { x: 0, y: 100 },
    data: { label: 'Remote Work', kind: 'Topic', weight: 0.92, summary: 'The team switched to fully remote work.' },
  },
  {
    id: 'productivity_up',
    type: 'concept',
    position: { x: 380, y: 0 },
    data: { label: 'Boosts Productivity', kind: 'Claim', weight: 0.74, summary: 'Remote work made the team more productive.' },
  },
  {
    id: 'collaboration_down',
    type: 'concept',
    position: { x: 380, y: 220 },
    data: { label: 'Reduces Collaboration', kind: 'Claim', weight: 0.68, summary: 'Spontaneous collaboration dropped after going remote.' },
  },
]

export const initialEdges = [
  {
    id: 'e_remote_work__productivity_up',
    source: 'remote_work',
    target: 'productivity_up',
    label: 'supports',
    type: 'default',
    className: 'edge-solid',
    data: { gap: false, confidence: 0.9, relation: 'supports' },
  },
  {
    id: 'e_productivity_up__collaboration_down',
    source: 'productivity_up',
    target: 'collaboration_down',
    type: 'contradiction', // ← rendered by ContradictionEdge (glowing red dashed line)
    data: { gap: true, type: 'contradiction', confidence: 0.81, relation: 'contradicts' },
  },
]
