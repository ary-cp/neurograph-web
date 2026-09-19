import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, test } from 'node:test'
import { createServer } from 'vite'
import {
  createRoomId,
  normalizeUsername,
  readSavedUsername,
  roomLocation,
  saveUsername,
} from '../src/lib/collaboration.js'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const originalFetch = globalThis.fetch
let server
let useGraphStore
let storage

function installStorage(values = {}) {
  storage = new Map(Object.entries(values))
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
  })
}

function restoreGlobals() {
  globalThis.fetch = originalFetch
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function node(id, x = 0, y = 0) {
  return { id, position: { x, y }, data: { label: id, kind: 'Topic' } }
}

function result(nodes = [], edges = []) {
  return {
    ok: true,
    nodes,
    edges,
    stats: { nodes: nodes.length, edges: edges.length, contradictions: 0 },
    meta: { persisted: true, noteId: 'test-note' },
  }
}

function response(value) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function join(roomId = 'room-abc-123', username = 'Aryan') {
  useGraphStore.getState().setRoomId(roomId)
  useGraphStore.getState().setUsername(username)
}

before(async () => {
  installStorage({ username: '  Saved identity  ' })
  try {
    server = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    })
    ;({ useGraphStore } = await server.ssrLoadModule('/src/store/useGraphStore.js'))
  } finally {
    restoreGlobals()
  }
})

beforeEach(() => {
  installStorage()
  globalThis.fetch = async () => { throw new Error('Unexpected network request in collaboration test') }
  useGraphStore.setState({ ...useGraphStore.getInitialState(), username: '' }, true)
})

afterEach(restoreGlobals)
after(async () => { await server?.close() })

test('new room IDs have the shareable format and do not repeat', () => {
  const ids = Array.from({ length: 200 }, () => createRoomId())
  assert.ok(ids.every((id) => /^room-[a-f0-9]{6}-[a-f0-9]{6}$/.test(id)))
  assert.equal(new Set(ids).size, ids.length)
})

test('room initialization preserves other parameters and hash, including blank-room links', () => {
  for (const search of ['?view=graph&filter=a%26b', '?view=graph&filter=a%26b&room=%20']) {
    const session = roomLocation({ pathname: '/app', search, hash: '#canvas' }, 'room-stable-123')
    const params = new URLSearchParams(session.replacement.search)
    assert.equal(session.roomId, 'room-stable-123')
    assert.equal(session.replacement.pathname, '/app')
    assert.equal(session.replacement.hash, '#canvas')
    assert.equal(params.get('room'), session.roomId)
    assert.equal(params.get('view'), 'graph')
    assert.equal(params.get('filter'), 'a&b')
    assert.equal(params.getAll('room').length, 1)
  }

  assert.deepEqual(roomLocation({ pathname: '/app', search: '?room=existing-room', hash: '#canvas' }), {
    roomId: 'existing-room',
    replacement: null,
  })
  assert.match(roomLocation({ pathname: '/app', search: '', hash: '' }).roomId, /^room-/)
})

test('identity is normalized, restored on startup, and saved under username', () => {
  assert.equal(useGraphStore.getInitialState().username, 'Saved identity')
  assert.equal(normalizeUsername('  Aryan\n\t Deo\u0000  '), 'Aryan Deo')
  assert.equal(normalizeUsername('x'.repeat(60)).length, 40)
  assert.equal(normalizeUsername(null), '')
  assert.equal(useGraphStore.getState().setUsername(' \t\n '), false)
  assert.equal(useGraphStore.getState().username, '')
  assert.equal(useGraphStore.getState().setUsername('  Aryan  '), true)
  assert.equal(storage.get('username'), 'Aryan')
  assert.equal(useGraphStore.getState().username, 'Aryan')
  assert.equal(readSavedUsername(), 'Aryan')
})

test('blocked localStorage still permits an in-memory identity', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('Storage unavailable') },
  })
  assert.equal(readSavedUsername(), '')
  assert.doesNotThrow(() => saveUsername('Aryan'))
  assert.equal(useGraphStore.getState().setUsername('Aryan'), true)
  assert.equal(useGraphStore.getState().username, 'Aryan')
})

test('synthesis submits exact author and room metadata while retaining the pending draft', async () => {
  join()
  useGraphStore.getState().setInput('  Hackathons waste time  ')
  const pending = deferred()
  const calls = []
  globalThis.fetch = (url, options) => {
    calls.push({ url, options })
    return pending.promise
  }

  const synthesis = useGraphStore.getState().synthesize()
  assert.equal(useGraphStore.getState().input, '  Hackathons waste time  ')
  assert.equal(useGraphStore.getState().isSynthesizing, true)
  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /\/api\/extract-graph$/)
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    text: '[Aryan]: Hackathons waste time',
    room_id: 'room-abc-123',
    existingNodes: [],
    origin: { x: 0, y: 0 },
    persist: true,
  })
  await useGraphStore.getState().synthesize()
  assert.equal(calls.length, 1, 'a pending synthesis cannot be submitted twice')

  pending.resolve(response(result([node('new-thought')])))
  await synthesis
  assert.equal(useGraphStore.getState().input, '')
  assert.equal(useGraphStore.getState().isSynthesizing, false)
})

test('missing room or name prevents all API calls', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return response(result()) }
  useGraphStore.getState().setInput('A thought worth exploring')
  useGraphStore.getState().setUsername('Aryan')
  await useGraphStore.getState().synthesize()
  assert.match(useGraphStore.getState().error, /join a room/)
  useGraphStore.getState().setRoomId('room-abc-123')
  useGraphStore.setState({ username: '' })
  await useGraphStore.getState().synthesize()
  assert.equal(calls, 0)
  assert.equal(useGraphStore.getState().isSynthesizing, false)
  assert.equal(useGraphStore.getState().input, 'A thought worth exploring')
})

test('switching rooms isolates graphs and restores each local draft', () => {
  join('room-a')
  const aNodes = [node('a1'), node('a2')]
  const aEdges = [{ id: 'edge-a', source: 'a1', target: 'a2' }]
  useGraphStore.setState({ nodes: aNodes, edges: aEdges, input: 'A draft', lastResult: { stats: { nodes: 2 } } })
  useGraphStore.getState().setRoomId('room-b')
  assert.deepEqual(useGraphStore.getState().nodes, [])
  assert.deepEqual(useGraphStore.getState().edges, [])
  assert.equal(useGraphStore.getState().input, '')
  assert.equal(useGraphStore.getState().lastResult, null)
  useGraphStore.setState({ nodes: [node('b1')], input: 'B draft' })
  useGraphStore.getState().setRoomId('room-a')
  assert.deepEqual(useGraphStore.getState().nodes, aNodes)
  assert.deepEqual(useGraphStore.getState().edges, aEdges)
  assert.equal(useGraphStore.getState().input, 'A draft')
  assert.deepEqual(useGraphStore.getState().lastResult, { stats: { nodes: 2 } })
  useGraphStore.getState().setRoomId('room-b')
  assert.deepEqual(useGraphStore.getState().nodes.map((n) => n.id), ['b1'])
  assert.equal(useGraphStore.getState().input, 'B draft')
  assert.deepEqual(useGraphStore.getState().edges, [])
})

test('A to B to A ignores the original response without stopping a newer request', async () => {
  join('room-a')
  useGraphStore.getState().setInput('Original draft')
  const first = deferred()
  const second = deferred()
  const requests = [first, second]
  globalThis.fetch = () => requests.shift().promise
  const staleSynthesis = useGraphStore.getState().synthesize()
  useGraphStore.getState().setRoomId('room-b')
  useGraphStore.getState().setRoomId('room-a')
  const currentSynthesis = useGraphStore.getState().synthesize()

  first.resolve(response(result([node('stale-node')])))
  await staleSynthesis
  assert.deepEqual(useGraphStore.getState().nodes, [])
  assert.equal(useGraphStore.getState().lastResult, null)
  assert.equal(useGraphStore.getState().input, 'Original draft')
  assert.equal(useGraphStore.getState().isSynthesizing, true)

  second.resolve(response(result([node('current-node')])))
  await currentSynthesis
  assert.deepEqual(useGraphStore.getState().nodes.map((n) => n.id), ['current-node'])
  assert.equal(useGraphStore.getState().isSynthesizing, false)
})

test('a stale request failure cannot change the error or pending status in another room', async (t) => {
  t.mock.method(console, 'error', () => {})
  join('room-a')
  useGraphStore.getState().setInput('A draft')
  const first = deferred()
  const second = deferred()
  const requests = [first, second]
  globalThis.fetch = () => requests.shift().promise
  const staleSynthesis = useGraphStore.getState().synthesize()
  useGraphStore.getState().setRoomId('room-b')
  useGraphStore.getState().setInput('B draft')
  const currentSynthesis = useGraphStore.getState().synthesize()
  first.reject(new Error('A request failed'))
  await staleSynthesis
  assert.equal(useGraphStore.getState().error, null)
  assert.equal(useGraphStore.getState().isSynthesizing, true)
  assert.equal(useGraphStore.getState().input, 'B draft')

  second.resolve(response(result([node('b1')])))
  await currentSynthesis
  assert.equal(useGraphStore.getState().error, null)
  assert.deepEqual(useGraphStore.getState().nodes.map((n) => n.id), ['b1'])
})

test('successful synthesis preserves current node positions and newer text while updating result metadata', async () => {
  join()
  useGraphStore.setState({ nodes: [node('existing', 10, 20)], input: 'Submitted draft', fitVersion: 3 })
  const pending = deferred()
  globalThis.fetch = () => pending.promise
  const synthesis = useGraphStore.getState().synthesize()
  useGraphStore.getState().onNodesChange([{ id: 'existing', type: 'position', position: { x: 700, y: 900 } }])
  useGraphStore.getState().setInput('New unsent draft')
  const incoming = result([node('existing', -1, -1), node('fresh')], [
    { id: 'new-edge', source: 'existing', target: 'fresh', type: 'contradiction' },
  ])
  incoming.stats.contradictions = 1
  pending.resolve(response(incoming))
  await synthesis

  const state = useGraphStore.getState()
  assert.deepEqual(state.nodes.find((n) => n.id === 'existing').position, { x: 700, y: 900 })
  assert.equal(state.nodes.filter((n) => n.id === 'existing').length, 1)
  assert.equal(state.nodes.find((n) => n.id === 'fresh').data.isNew, true)
  assert.equal(state.edges[0].type, 'contradiction')
  assert.equal(state.input, 'New unsent draft')
  assert.equal(state.isSynthesizing, false)
  assert.equal(state.fitVersion, 4)
  assert.deepEqual(state.recentNodeIds, ['existing', 'fresh'])
  assert.deepEqual(state.lastResult.stats, incoming.stats)
  assert.deepEqual(state.lastResult.meta, incoming.meta)
  assert.ok(Number.isFinite(state.lastResult.at))
})
