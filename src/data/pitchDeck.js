
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
const t = (minsAgo) => Date.now() - minsAgo * 60 * 1000

export const PITCH_GRAPH = {
  nodes: [
    n('slide1', 'Topic', 'Information Overload', 'Researchers and students consume too many notes and tabs.', 1, 0, 0),
    n('slide1_problem', 'Claim', 'Missing Connections', 'It is incredibly hard to connect the dots across different sources.', 0.8, 340, 0),

    n('slide2', 'Entity', 'NeuroGraph', 'An AI-powered Idea Collision Engine.', 1, 0, 300),
    n('slide2_feature1', 'Claim', 'Live Knowledge Graphs', 'Turns messy notes into a connected graph instantly.', 0.9, 340, 200),
    n('slide2_feature2', 'Claim', 'Finds Collisions', 'Automatically detects contradictions and agreements.', 0.9, 340, 400),

    n('slide3', 'Topic', 'Tech Stack', 'The architecture powering NeuroGraph.', 1, 700, 300),
    n('stack_groq', 'Entity', 'Groq (Qwen 27B)', 'Sub-second NLP extraction and logical reasoning.', 0.8, 1040, 150),
    n('stack_reactflow', 'Entity', 'React Flow', 'Custom Neo-brutalist interactive canvas.', 0.8, 1040, 300),
    n('stack_jina', 'Entity', 'Jina AI', 'Instant Web-to-Markdown reading for sources.', 0.8, 1040, 450),

    n('slide4', 'Event', 'Live Multiplayer Demo', 'NeuroGraph syncs instantly across the room via Supabase.', 1, 700, 700),
    n('slide4_action', 'Claim', 'Scan the QR Code', 'Judges can scan the QR code to participate live.', 0.9, 1040, 700)
  ],
  edges: [
    rel('slide1', 'slide1_problem', 'causes', 0.9),
    rel('slide2', 'slide1_problem', 'solves', 0.95),
    rel('slide2', 'slide2_feature1', 'provides', 0.9),
    rel('slide2', 'slide2_feature2', 'provides', 0.9),
    
    rel('slide2', 'slide3', 'powered by', 0.9),
    rel('slide3', 'stack_groq', 'uses', 0.9),
    rel('slide3', 'stack_reactflow', 'uses', 0.9),
    rel('slide3', 'stack_jina', 'uses', 0.9),
    
    rel('slide2', 'slide4', 'demonstrates', 0.9),
    rel('slide4', 'slide4_action', 'requires', 0.8)
  ]
}

export const PITCH_ENTRIES = [
  {
    id: 'pitch-1', at: t(10), author: 'Aryan', intent: 'analytical',
    text: 'Slide 1: Information Overload. Students and researchers consume too many notes, articles, and bookmarks, but fail to connect the dots.',
    nodeIds: ['slide1', 'slide1_problem'],
    stats: { nodes: 2, edges: 1, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 50 },
  },
  {
    id: 'pitch-2', at: t(8), author: 'Aryan', intent: 'analytical',
    text: 'Slide 2: The Solution is NeuroGraph. It is an AI-powered Idea Collision Engine that builds knowledge graphs in real-time.',
    nodeIds: ['slide2', 'slide2_feature1', 'slide2_feature2'],
    stats: { nodes: 3, edges: 3, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 40 },
  },
  {
    id: 'pitch-3', at: t(6), author: 'Aryan', intent: 'analytical',
    text: 'Slide 3: Our Tech Stack. We used Groq for sub-second NLP extraction, React Flow for the Neo-brutalist canvas, and Jina AI for web reading.',
    nodeIds: ['slide3', 'stack_groq', 'stack_reactflow', 'stack_jina'],
    stats: { nodes: 4, edges: 4, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 60 },
  },
  {
    id: 'pitch-4', at: t(2), author: 'Aryan', intent: 'analytical',
    text: 'Slide 4: Real-time Multiplayer Demo! NeuroGraph syncs instantly across the room. I request the judges to scan the QR code to participate!',
    nodeIds: ['slide4', 'slide4_action'],
    stats: { nodes: 2, edges: 2, contradictions: 0 }, meta: { model: 'pitch-mode', latencyMs: 50 },
  }
]
