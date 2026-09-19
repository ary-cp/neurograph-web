import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createVoiceInput } from '../src/lib/voiceInput.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

function harness(t, { permission, transcribe, constructorError } = {}) {
  const tracks = [{ stopped: 0 }, { stopped: 0 }]
  for (const track of tracks) track.stop = () => { track.stopped += 1 }
  const stream = { getTracks: () => tracks, getAudioTracks: () => tracks }
  const recorders = []
  const changes = []
  const events = []
  const uploads = []
  const subscribers = new Set()
  const calls = { permissions: 0 }
  let state

  function setState(patch) {
    const previous = state
    state = { ...state, ...patch }
    for (const subscriber of [...subscribers]) subscriber(state, previous)
  }

  state = {
    roomId: 'room-voice-test',
    roomVersion: 1,
    username: 'Aryan',
    input: 'An existing draft',
    isSynthesizing: false,
    setInput: (text) => {
      events.push(['setInput', text])
      setState({ input: text })
    },
    synthesize: async () => {
      events.push(['synthesize', state.input])
    },
  }

  class Recorder {
    static isTypeSupported(type) {
      return type === 'audio/webm;codecs=opus'
    }

    constructor(source, options = {}) {
      if (constructorError) throw constructorError
      this.stream = source
      this.mimeType = options.mimeType || 'audio/webm'
      this.state = 'inactive'
      this.stopCalls = 0
      recorders.push(this)
    }

    start() {
      this.state = 'recording'
    }

    stop() {
      if (this.state === 'inactive') throw new DOMException('Already stopped', 'InvalidStateError')
      this.stopCalls += 1
      this.state = 'inactive'
      // The browser delivers the final dataavailable and stop events asynchronously.
      // Tests control their order to catch premature or duplicate uploads.
    }

    data(value) {
      this.ondataavailable?.({ data: new Blob([value], { type: this.mimeType }) })
    }

    async ended() {
      this.state = 'inactive'
      await this.onstop?.()
      await flush()
    }
  }

  const store = {
    getState: () => state,
    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      return () => subscribers.delete(subscriber)
    },
  }
  const voice = createVoiceInput({
    store,
    mediaDevices: {
      getUserMedia: (constraints) => {
        calls.permissions += 1
        assert.equal(constraints.audio, true)
        assert.notEqual(constraints.video, true)
        return permission ? permission.promise : Promise.resolve(stream)
      },
    },
    Recorder,
    transcribe: async (blob, options) => {
      uploads.push({ blob, ...options })
      return transcribe ? transcribe(blob, options) : '  Spoken thought  '
    },
    onChange: (value) => changes.push({ ...value }),
  })
  t.after(() => voice.destroy())

  return {
    voice, stream, tracks, recorders, changes, events, uploads, calls, subscribers,
    getState: () => state,
    setState,
    get ui() { return changes.at(-1) },
  }
}

test('stop includes the final chunk and synthesizes the transcript exactly once', async (t) => {
  const h = harness(t)
  await h.voice.start()
  const recorder = h.recorders[0]
  recorder.data('first-')

  h.voice.stop()
  h.voice.stop()
  assert.equal(recorder.stopCalls, 1)
  assert.equal(h.uploads.length, 0, 'wait for the browser to finish the audio')
  assert.ok(h.tracks.every((track) => track.stopped > 0), 'stop releases the microphone')

  recorder.data('last')
  await recorder.ended()
  await recorder.ended()

  assert.equal(h.uploads.length, 1)
  assert.equal(await h.uploads[0].blob.text(), 'first-last')
  assert.deepEqual(h.events, [
    ['setInput', 'Spoken thought'],
    ['synthesize', 'Spoken thought'],
  ])
  assert.equal(h.ui.status, 'idle')
  assert.equal(h.ui.error, null)
})

test('rapid starts share one active microphone request', async (t) => {
  const permission = deferred()
  const h = harness(t, { permission })
  const first = h.voice.start()
  const second = h.voice.start()
  assert.equal(h.calls.permissions, 1)
  assert.equal(h.ui.status, 'requesting')

  permission.resolve(h.stream)
  await Promise.all([first, second])
  assert.equal(h.recorders.length, 1)
  assert.equal(h.ui.status, 'recording')
})

test('cancel before permission resolves releases the late stream without recording', async (t) => {
  const permission = deferred()
  const h = harness(t, { permission })
  const pending = h.voice.start()
  h.voice.cancel()
  assert.equal(h.ui.status, 'idle')

  permission.resolve(h.stream)
  await pending
  assert.ok(h.tracks.every((track) => track.stopped > 0))
  assert.equal(h.recorders.length, 0)
  assert.equal(h.uploads.length, 0)
  assert.equal(h.getState().input, 'An existing draft')
})

test('cancel after stop discards delayed recorder events', async (t) => {
  const h = harness(t)
  await h.voice.start()
  const recorder = h.recorders[0]
  const lateStop = recorder.onstop
  h.voice.stop()
  h.voice.cancel()
  recorder.data('discarded speech')
  await lateStop?.()
  await flush()

  assert.equal(h.uploads.length, 0)
  assert.equal(h.events.length, 0)
  assert.equal(h.ui.status, 'idle')
})

test('a room version change aborts transcription and ignores a late response', async (t) => {
  const result = deferred()
  const h = harness(t, { transcribe: () => result.promise })
  await h.voice.start()
  const recorder = h.recorders[0]
  recorder.data('speech')
  h.voice.stop()
  const finishing = recorder.ended()
  await flush()
  assert.equal(h.ui.status, 'transcribing')
  assert.equal(h.uploads.length, 1)

  h.setState({ roomVersion: 2 })
  assert.equal(h.uploads[0].signal.aborted, true)
  result.resolve('A stale transcript')
  await finishing
  assert.equal(h.events.length, 0)
  assert.equal(h.getState().input, 'An existing draft')
  assert.equal(h.ui.status, 'idle')
})

test('cancel during transcription preserves the draft even when the transport resolves late', async (t) => {
  const result = deferred()
  const h = harness(t, { transcribe: () => result.promise })
  await h.voice.start()
  const recorder = h.recorders[0]
  recorder.data('speech')
  h.voice.stop()
  const finishing = recorder.ended()
  await flush()
  h.voice.cancel()
  assert.equal(h.uploads[0].signal.aborted, true)

  result.resolve('Canceled transcript')
  await finishing
  assert.equal(h.events.length, 0)
  assert.equal(h.getState().input, 'An existing draft')
  assert.equal(h.ui.status, 'idle')
})

test('microphone permission denial recovers with an actionable error', async (t) => {
  const permission = deferred()
  const h = harness(t, { permission })
  const pending = h.voice.start()
  permission.reject(new DOMException('Permission denied', 'NotAllowedError'))
  await pending

  assert.equal(h.ui.status, 'idle')
  assert.ok(h.ui.error)
  assert.equal(h.recorders.length, 0)
  assert.equal(h.uploads.length, 0)
  h.voice.dismissError()
  assert.equal(h.ui.error, null)
})

test('recorder construction failure releases an already acquired microphone', async (t) => {
  const h = harness(t, { constructorError: new Error('Recorder could not be constructed') })
  await h.voice.start()

  assert.ok(h.tracks.every((track) => track.stopped > 0))
  assert.equal(h.ui.status, 'idle')
  assert.ok(h.ui.error)
  assert.equal(h.uploads.length, 0)
})

test('recorder errors discard subsequent stop events and never upload partial audio', async (t) => {
  const h = harness(t)
  await h.voice.start()
  const recorder = h.recorders[0]
  const lateStop = recorder.onstop
  recorder.data('partial speech')
  recorder.onerror?.({ error: new DOMException('Recording failed', 'UnknownError') })
  await lateStop?.()
  await flush()

  assert.ok(h.tracks.every((track) => track.stopped > 0))
  assert.equal(h.uploads.length, 0)
  assert.equal(h.events.length, 0)
  assert.equal(h.ui.status, 'idle')
  assert.ok(h.ui.error)
})

test('an empty recording does not upload or erase the draft', async (t) => {
  const h = harness(t)
  await h.voice.start()
  const recorder = h.recorders[0]
  h.voice.stop()
  recorder.data('')
  await recorder.ended()

  assert.equal(h.uploads.length, 0)
  assert.equal(h.events.length, 0)
  assert.equal(h.getState().input, 'An existing draft')
  assert.ok(h.ui.error)
})

test('an empty transcript does not synthesize or erase the draft', async (t) => {
  const h = harness(t, { transcribe: async () => ' \n  ' })
  await h.voice.start()
  const recorder = h.recorders[0]
  recorder.data('speech')
  h.voice.stop()
  await recorder.ended()

  assert.equal(h.uploads.length, 1)
  assert.equal(h.events.length, 0)
  assert.equal(h.getState().input, 'An existing draft')
  assert.equal(h.ui.status, 'idle')
  assert.ok(h.ui.error)
})

test('destroy stops recording and unsubscribes without publishing late UI changes', async (t) => {
  const h = harness(t)
  await h.voice.start()
  const recorder = h.recorders[0]
  const lateStop = recorder.onstop
  recorder.data('discarded speech')
  h.voice.destroy()
  const countAfterDestroy = h.changes.length

  assert.ok(h.tracks.every((track) => track.stopped > 0))
  assert.equal(recorder.state, 'inactive')
  assert.equal(h.subscribers.size, 0)
  await lateStop?.()
  await flush()
  assert.equal(h.changes.length, countAfterDestroy)
  assert.equal(h.uploads.length, 0)
  assert.equal(h.events.length, 0)
})
