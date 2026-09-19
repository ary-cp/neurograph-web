import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, test } from 'node:test'
import { createServer } from 'vite'

const originalFetch = globalThis.fetch
let server
let transcribeAudio
let ApiError

const audio = (type = 'audio/webm;codecs=opus') => new Blob(['voice recording'], { type })
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

function pendingUntilAbort(signal) {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })
}

before(async () => {
  server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  })
  ;({ transcribeAudio, ApiError } = await server.ssrLoadModule('/src/lib/api.js'))
})

beforeEach(() => {
  globalThis.fetch = async () => { throw new Error('Unexpected network request in transcription test') }
})
afterEach(() => { globalThis.fetch = originalFetch })
after(async () => { await server?.close() })

test('uploads multipart audio with its actual format and returns trimmed text', async () => {
  for (const [type, extension] of [
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/ogg;codecs=opus', 'ogg'],
    ['audio/mp4', 'mp4'],
    ['audio/wav', 'wav'],
  ]) {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, `${(server.config.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/transcribe`)
      assert.equal(options.method, 'POST')
      assert.equal(options.headers, undefined, 'the browser must supply the multipart boundary')
      assert.ok(options.body instanceof FormData)
      assert.deepEqual([...options.body.keys()], ['audio'])
      const file = options.body.get('audio')
      assert.equal(file.name, `recording.${extension}`)
      assert.equal(file.type, type)
      assert.equal(await file.text(), 'voice recording')
      return json({ ok: true, text: '  Spoken idea\n' })
    }
    assert.equal(await transcribeAudio(audio(type)), 'Spoken idea')
  }
})

test('empty recordings fail before making a request', async () => {
  await assert.rejects(transcribeAudio(new Blob([])), (error) => error instanceof ApiError && /No audio/.test(error.message))
})

test('server errors preserve readable details and status', async () => {
  globalThis.fetch = async () => json({ ok: false, error: 'Audio format is not supported.' }, 415)
  await assert.rejects(transcribeAudio(audio()), (error) => error instanceof ApiError && error.status === 415 && error.message === 'Audio format is not supported.')

  globalThis.fetch = async () => json({ ok: false, issues: [{ message: 'Recording is too long.' }] })
  await assert.rejects(transcribeAudio(audio()), /Recording is too long/)
})

test('malformed, missing, and empty transcripts cannot be synthesized', async () => {
  for (const body of ['not json', 'null', '{"ok":true}', '{"ok":true,"text":42}']) {
    globalThis.fetch = async () => new Response(body)
    await assert.rejects(transcribeAudio(audio()), (error) => error instanceof ApiError && /invalid response/.test(error.message))
  }
  globalThis.fetch = async () => json({ ok: true, text: ' \n ' })
  await assert.rejects(transcribeAudio(audio()), /No speech was detected/)

  globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 503 })
  await assert.rejects(transcribeAudio(audio()), (error) => error.status === 503 && /503/.test(error.message))
})

test('network failures have a transcription-specific message', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(transcribeAudio(audio()), (error) => error instanceof ApiError && /Cannot reach the transcription server/.test(error.message))
})

test('an already canceled upload never reaches the server', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(transcribeAudio(audio(), { signal: controller.signal }), (error) => error instanceof ApiError && /canceled/.test(error.message))
})

test('canceling an upload aborts the fetch without misreporting a timeout', async () => {
  const controller = new AbortController()
  let uploadSignal
  globalThis.fetch = async (_, { signal }) => {
    uploadSignal = signal
    return pendingUntilAbort(signal)
  }
  const upload = transcribeAudio(audio(), { signal: controller.signal })
  const rejection = assert.rejects(upload, /was canceled/)
  controller.abort()
  await rejection
  assert.equal(uploadSignal.aborted, true)
})

test('the 120-second deadline covers a stalled response body', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  let bodyStarted
  const readingBody = new Promise((resolve) => { bodyStarted = resolve })
  globalThis.fetch = async (_, { signal }) => ({
    ok: true,
    status: 200,
    json() {
      bodyStarted()
      return pendingUntilAbort(signal)
    },
  })
  const upload = transcribeAudio(audio())
  const rejection = assert.rejects(upload, /took too long/)
  await readingBody
  context.mock.timers.tick(120_000)
  await rejection
})
