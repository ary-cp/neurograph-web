/**
 * Thin client for the NeuroGraph "brain" (neurograph-server).
 * BASE is '' in dev → same-origin /api → Vite proxy → Express. In prod set VITE_API_URL.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 45_000
const TRANSCRIBE_TIMEOUT_MS = 120_000

export class ApiError extends Error {
  constructor(message, { status, issues, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  signal?.addEventListener('abort', () => controller.abort(), { once: true })

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    throw new ApiError(
      err?.name === 'AbortError'
        ? 'The model took too long — try a shorter note.'
        : 'Cannot reach the NeuroGraph server. Is `npm run dev` running in neurograph-server (port 4000)?',
      { cause: err },
    )
  } finally {
    clearTimeout(timer)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) {
    const detail = data.issues?.map((i) => i.message).join(', ')
    throw new ApiError(detail || data.error || `Server error ${res.status}`, { status: res.status, issues: data.issues })
  }
  return data
}

/**
 * POST /api/extract-graph
 * @param {{ text: string, room_id?: string, existingNodes?: {id:string,label:string,kind?:string}[], origin?: {x:number,y:number}, direction?: 'LR'|'TB', persist?: boolean }} payload
 * @returns {Promise<{ ok: true, nodes: object[], edges: object[], stats: object, meta: object }>}
 */
export function extractGraph(payload, opts) {
  return request('/api/extract-graph', { method: 'POST', body: payload, ...opts })
}

export function updateNode(roomId, node) {
  return request('/api/update-node', { method: 'POST', body: { room_id: roomId, node } })
}

/**
 * GET /api/room/:roomId — the merged graph of every note saved to a multiplayer room.
 * @returns {Promise<{ ok: true, room_id: string, nodes: object[], edges: object[], stats: object, notes: object[] }>}
 */
export function getRoomGraph(roomId, { limit, layout } = {}) {
  const qs = new URLSearchParams()
  if (limit) qs.set('limit', String(limit))
  if (layout) qs.set('layout', layout)
  const suffix = qs.size ? `?${qs}` : ''
  return request(`/api/room/${encodeURIComponent(roomId)}${suffix}`)
}

export function health() {
  return request('/api/health')
}

/** Upload a recorded voice note and return its transcript. */
export async function transcribeAudio(blob, { signal } = {}) {
  if (signal?.aborted) throw new ApiError('Voice transcription was canceled.')
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new ApiError('No audio was recorded. Please try again.')
  }

  const extensions = {
    'audio/webm': 'webm',
    'video/webm': 'webm',
    'audio/ogg': 'ogg',
    'application/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'video/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/wave': 'wav',
    'audio/vnd.wave': 'wav',
  }
  const extension = extensions[blob.type.split(';')[0].trim().toLowerCase()] ?? 'bin'
  const form = new FormData()
  form.append('audio', blob, `recording.${extension}`)

  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TRANSCRIBE_TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE}/api/transcribe`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    let data
    try {
      data = await res.json()
    } catch (cause) {
      if (controller.signal.aborted) throw cause
      throw new ApiError(
        res.ok ? 'The transcription server returned an invalid response.' : `Transcription failed (server error ${res.status}).`,
        { status: res.status, cause },
      )
    }

    if (!res.ok || data?.ok === false) {
      const issues = Array.isArray(data?.issues) ? data.issues : undefined
      const detail = issues?.map((issue) => issue?.message).filter((message) => typeof message === 'string').join(', ')
      const message = typeof data?.error === 'string' ? data.error : undefined
      throw new ApiError(detail || message || `Transcription failed (server error ${res.status}).`, { status: res.status, issues })
    }
    if (data?.ok !== true || typeof data.text !== 'string') {
      throw new ApiError('The transcription server returned an invalid response.', { status: res.status })
    }
    const text = data.text.trim()
    if (!text) throw new ApiError('No speech was detected. Please try recording again.', { status: res.status })
    return text
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new ApiError(timedOut ? 'Voice transcription took too long. Please try a shorter recording.' : 'Voice transcription was canceled.', { cause })
    }
    if (cause instanceof ApiError) throw cause
    throw new ApiError('Cannot reach the transcription server. Please check your connection and try again.', { cause })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
