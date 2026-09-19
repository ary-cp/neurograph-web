/**
 * Node kinds — same palette as before (teal / ocean / bronze / sage), now with a glyph each so
 * kinds that share a colour are still told apart at a glance.
 */
export const KINDS = {
  Topic:    { hex: '#7f9e9d', glyph: '◇', hint: 'a subject area' },
  Concept:  { hex: '#477684', glyph: '○', hint: 'an abstract idea' },
  Claim:    { hex: '#a8815b', glyph: '▲', hint: 'an assertion that can be wrong' },
  Entity:   { hex: '#748753', glyph: '■', hint: 'a person, team, product or place' },
  Event:    { hex: '#a8815b', glyph: '◷', hint: 'something that happened or will' },
  Question: { hex: '#7f9e9d', glyph: '?', hint: 'an open question' },
  Note:     { hex: '#7f9e9d', glyph: '·', hint: 'unclassified' },
}

export const KIND_ORDER = ['Topic', 'Concept', 'Claim', 'Entity', 'Event', 'Question']
export const CONTRADICTION_HEX = '#f43f5e'

export const INTENT_META = {
  analytical: { label: 'Analytical', hex: '#7f9e9d', blurb: 'facts, notes, decisions' },
  brainstorm: { label: 'Brainstorm', hex: '#a8815b', blurb: 'questions, options, what-ifs' },
  research:   { label: 'Research',   hex: '#748753', blurb: 'links read live' },
}

export const kindOf = (kind) => KINDS[kind] ?? KINDS.Note
