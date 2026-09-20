
const n = (id, kind, label, summary, weight, x, y) => ({
  id, type: 'concept', position: { x, y }, data: { label, kind, summary, weight },
})
const rel = (source, target, label, confidence) => ({
  id: `e___`, source, target, type: 'default', className: 'edge-solid', label,
  data: { gap: false, confidence, relation: label },
})
const gap = (source, target, confidence) => ({
  id: `e___`, source, target, type: 'contradiction', className: 'edge-gap',
  data: { gap: true, type: 'contradiction', confidence, relation: 'contradicts' },
})
const t = (minsAgo) => Date.now() - minsAgo * 60 * 1000

export const PITCH_GRAPH = {
  nodes: [
    n('slide1', 'Topic', 'Information Overload', 'We consume massive amounts of research, notes, and links daily.', 1, 0, 0),
    n('slide1_problem', 'Claim', 'Missing Connections', 'Human brains struggle to synthesize scattered data across tabs.', 0.8, 340, 0),

    n('slide2', 'Topic', 'Current Tools Fail', 'Notion and Evernote just hoard information as dead text.', 1, 0, 180),
    n('slide2_gap', 'Claim', 'No Semantic Linking', 'They rely on manual folders instead of natural thought-collision.', 0.8, 340, 180),

    n('slide3', 'Entity', 'NeuroGraph', 'An AI-powered Idea Collision Engine.', 1, 0, 400),
    n('slide3_feat1', 'Claim', 'Synthesizes instantly', 'Converts unstructured text and voice into knowledge graphs.', 0.9, 340, 320),
    n('slide3_feat2', 'Claim', 'Detects Collisions', 'Finds contradictions and hidden links autonomously.', 0.9, 340, 480),

    n('slide4', 'Topic', 'Architecture', 'Built for blazing-fast inference and multiplayer.', 1, 700, 400),
    n('stack_groq', 'Entity', 'Groq (Qwen)', 'Sub-second NLP extraction and logical reasoning.', 0.8, 1040, 250),
    n('stack_reactflow', 'Entity', 'React Flow', 'Custom Neo-brutalist interactive canvas.', 0.8, 1040, 370),
    n('stack_jina', 'Entity', 'Jina AI', 'Instant Web-to-Markdown reading for sources.', 0.8, 1040, 490),
    n('stack_whisper', 'Entity', 'Whisper AI', 'Seamless voice-to-graph transcription.', 0.8, 1040, 610),
    n('stack_node', 'Entity', 'Node.js & Supabase', 'Real-time WebSocket/Polling backend.', 0.8, 1040, 730),

    n('slide5', 'Event', 'Judges Challenges', 'We deployed your feedback live during the hackathon.', 1, 0, 650),
    n('task_noise', 'Claim', 'Noise Filtering', 'Meeting notes now strictly filter out small talk.', 0.9, 340, 600),
    n('task_speakers', 'Claim', 'Nested Speakers', 'Identifies who made which claim automatically.', 0.9, 340, 700),
    n('task_source', 'Claim', 'Source Tracking', 'Inspector now tracks the original URL of web data.', 0.9, 340, 800),

    n('slide6', 'Event', 'Live Multiplayer Demo', 'NeuroGraph syncs instantly across the room.', 1, 700, 900),
    n('slide6_action', 'Claim', 'Scan the QR Code', 'Judges, please scan to synthesize your thoughts live.', 0.9, 1040, 900)
  ],
  edges: [
    rel('slide1', 'slide1_problem', 'causes', 0.9),
    rel('slide2', 'slide2_gap', 'suffers from', 0.9),
    gap('slide3', 'slide2', 0.95),
    
    rel('slide3', 'slide3_feat1', 'provides', 0.9),
    rel('slide3', 'slide3_feat2', 'provides', 0.9),
    
    rel('slide3', 'slide4', 'powered by', 0.9),
    rel('slide4', 'stack_groq', 'uses', 0.9),
    rel('slide4', 'stack_reactflow', 'uses', 0.9),
    rel('slide4', 'stack_jina', 'uses', 0.9),
    rel('slide4', 'stack_whisper', 'uses', 0.9),
    rel('slide4', 'stack_node', 'uses', 0.9),

    rel('slide5', 'task_noise', 'implemented', 0.9),
    rel('slide5', 'task_speakers', 'implemented', 0.9),
    rel('slide5', 'task_source', 'implemented', 0.9),
    
    rel('slide3', 'slide6', 'demonstrates', 0.9),
    rel('slide6', 'slide6_action', 'requires', 0.8)
  ]
}

export const PITCH_ENTRIES = [
  {
    id: 'pitch-1', at: t(12), author: 'Aryan', intent: 'analytical',
    text: 'Slide 1: Information Overload. We consume massive amounts of research, notes, and links daily, but our brains struggle to synthesize scattered data across tabs.',
    nodeIds: ['slide1', 'slide1_problem'],
    stats: { nodes: 2, edges: 1, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 50 },
  },
  {
    id: 'pitch-2', at: t(10), author: 'Aryan', intent: 'analytical',
    text: 'Slide 2: The Missing Link. Current tools like Notion and Evernote just hoard information as dead text with no semantic linking.',
    nodeIds: ['slide2', 'slide2_gap'],
    stats: { nodes: 2, edges: 1, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 40 },
  },
  {
    id: 'pitch-3', at: t(8), author: 'Aryan', intent: 'analytical',
    text: 'Slide 3: NeuroGraph. An AI-powered Idea Collision Engine that converts unstructured text and voice into knowledge graphs, detecting hidden contradictions.',
    nodeIds: ['slide3', 'slide3_feat1', 'slide3_feat2'],
    stats: { nodes: 3, edges: 3, contradictions: 1 }, meta: { model: 'pitch-mode', latencyMs: 60 },
  },
  {
    id: 'pitch-4', at: t(6), author: 'Aryan', intent: 'analytical',
    text: 'Slide 4: Architecture. Built for blazing-fast inference using Groq (Qwen), React Flow, Jina AI, Whisper AI, and Node.js + Supabase.',
    nodeIds: ['slide4', 'stack_groq', 'stack_reactflow', 'stack_jina', 'stack_whisper', 'stack_node'],
    stats: { nodes: 6, edges: 6, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 50 },
  },
  {
    id: 'pitch-5', at: t(4), author: 'Aryan', intent: 'analytical',
    text: 'Slide 5: Live Execution. We took the judges\' challenges and deployed them live: Noise Filtering for meetings, Nested Speaker tracking, and Source URL tracking.',
    nodeIds: ['slide5', 'task_noise', 'task_speakers', 'task_source'],
    stats: { nodes: 4, edges: 3, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 50 },
  },
  {
    id: 'pitch-6', at: t(2), author: 'Aryan', intent: 'analytical',
    text: 'Slide 6: Live Multiplayer Demo! NeuroGraph syncs instantly across the room. I request the judges to scan the QR code to synthesize your thoughts live!',
    nodeIds: ['slide6', 'slide6_action'],
    stats: { nodes: 2, edges: 2, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 50 },
  }
]
