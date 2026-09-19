/**
 * A curated constellation for demos and screenshots (`?demo` or ⌘K → "Load demo constellation").
 * Same shape the server returns; nothing here is persisted.
 */
const n = (id, kind, label, summary, weight, x, y) => ({
  id, type: 'concept', position: { x, y }, data: { label, kind, summary, weight },
})
const rel = (source, target, label, confidence) => ({
  id: `e_${source}__${target}`, source, target, type: 'default', className: 'edge-solid', label,
  data: { gap: false, confidence, relation: label },
})
const gap = (source, target, confidence) => ({
  id: `e_${source}__${target}`, source, target, type: 'contradiction', className: 'edge-gap',
  data: { gap: true, type: 'contradiction', confidence, relation: 'contradicts' },
})

export const DEMO_GRAPH = {
  nodes: [
    n('remote_work', 'Topic', 'Remote work', 'The team went fully remote at the start of the year.', 1, 0, 220),
    n('deep_focus', 'Concept', 'Deep focus time', 'Fewer interruptions, longer uninterrupted blocks.', 0.8, 340, 60),
    n('productivity_up', 'Claim', 'Productivity went up', 'Q1 output rose 12% after going remote.', 0.85, 680, 60),
    n('collaboration_down', 'Claim', 'Spontaneous collaboration dropped', 'Hallway conversations and whiteboarding stopped.', 0.75, 340, 380),
    n('output_dropped', 'Claim', 'Output fell 15% by Q3', 'Three-month data shows output down 15% since going remote.', 0.9, 1020, 180),
    n('hybrid_proposal', 'Claim', 'Try hybrid Tuesdays', 'Priya proposes two anchor days in the office.', 0.6, 680, 380),
    n('priya', 'Entity', 'Priya', 'Design lead who raised the collaboration concern.', 0.4, 680, 560),
    n('offsite_oct', 'Event', 'October offsite', 'A planned in-person week to reset team rituals.', 0.5, 1020, 440),
    n('focus_vs_serendipity', 'Question', 'Can focus and serendipity coexist?', 'The open question behind the hybrid experiment.', 0.7, 1020, 640),
    n('async_first', 'Claim', 'Async-first fixed the gap', 'Written decisions replaced most meetings.', 0.65, 340, 620),
  ],
  edges: [
    rel('remote_work', 'deep_focus', 'enables', 0.9),
    rel('deep_focus', 'productivity_up', 'supports', 0.8),
    rel('remote_work', 'collaboration_down', 'caused', 0.85),
    gap('output_dropped', 'productivity_up', 0.9),
    rel('collaboration_down', 'hybrid_proposal', 'motivates', 0.7),
    rel('priya', 'hybrid_proposal', 'proposes', 0.9),
    rel('hybrid_proposal', 'offsite_oct', 'tested at', 0.6),
    rel('collaboration_down', 'focus_vs_serendipity', 'raises', 0.7),
    gap('async_first', 'collaboration_down', 0.7),
    rel('async_first', 'focus_vs_serendipity', 'informs', 0.5),
  ],
}

const t = (minutesAgo) => Date.now() - minutesAgo * 60_000

export const DEMO_ENTRIES = [
  {
    id: 'demo-1', at: t(41), author: 'Binod', intent: 'analytical',
    text: 'Switching to remote work made our team more productive, but design reviews got worse because nobody whiteboards anymore. Priya thinks we should try hybrid Tuesdays.',
    nodeIds: ['remote_work', 'deep_focus', 'productivity_up', 'collaboration_down', 'hybrid_proposal', 'priya'],
    stats: { nodes: 6, edges: 5, contradictions: 0 }, meta: { model: 'llama-3.3-70b-versatile', latencyMs: 812 },
  },
  {
    id: 'demo-2', at: t(22), author: 'Aryan', intent: 'research',
    text: 'Update after 3 months: the numbers show output actually dropped 15% since we went remote. https://en.wikipedia.org/wiki/Remote_work',
    nodeIds: ['output_dropped'], stats: { nodes: 1, edges: 1, contradictions: 1 },
    research: [{ ok: true, title: 'Remote work — Wikipedia', url: 'https://en.wikipedia.org/wiki/Remote_work', chars: 7980, truncated: true }],
    meta: { model: 'llama-3.3-70b-versatile', latencyMs: 1440 },
  },
  {
    id: 'demo-3', at: t(6), author: 'Priya', intent: 'brainstorm',
    text: 'Can focus and serendipity coexist? Async-first seems to have fixed the gap for us — maybe we test it properly at the October offsite?',
    nodeIds: ['offsite_oct', 'focus_vs_serendipity', 'async_first'], stats: { nodes: 3, edges: 4, contradictions: 1 },
    meta: { model: 'llama-3.3-70b-versatile', latencyMs: 930 },
  },
]
