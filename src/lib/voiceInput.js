const AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg']

export function isVoiceInputSupported() {
  return Boolean(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.MediaRecorder)
}

function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function microphoneError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone access was denied. Allow microphone access in your browser and try again.'
    case 'NotFoundError':
      return 'No microphone was found. Connect a microphone and try again.'
    case 'NotReadableError':
      return 'Your microphone is unavailable. Check whether another app is using it.'
    default:
      return 'Could not start recording. Check your microphone and try again.'
  }
}

/** Own one recording at a time, including its stream, upload, and room identity. */
export function createVoiceInput({
  store,
  transcribe,
  onChange,
  onStream = () => {},
  mediaDevices = globalThis.navigator?.mediaDevices,
  Recorder = globalThis.MediaRecorder,
}) {
  let current = null
  let disposed = false
  let status = 'idle'

  const publish = (nextStatus, error = null) => {
    status = nextStatus
    if (!disposed) onChange({ status, error })
  }
  const isCurrent = (attempt) => !disposed && current === attempt
  const sameRoom = (attempt) => {
    const state = store.getState()
    return state.roomId === attempt.roomId && state.roomVersion === attempt.roomVersion && state.username === attempt.username
  }

  function release(attempt) {
    if (attempt.recorder) {
      attempt.recorder.ondataavailable = null
      attempt.recorder.onstop = null
      attempt.recorder.onerror = null
      if (attempt.recorder.state !== 'inactive') {
        try { attempt.recorder.stop() } catch { /* It may already be stopping. */ }
      }
    }
    stopTracks(attempt.stream)
    attempt.stream = null
    onStream(null)
    attempt.chunks = []
    attempt.controller.abort()
  }

  function cancel() {
    const attempt = current
    current = null // Invalidate callbacks before stop() can dispatch more events.
    if (attempt) release(attempt)
    publish('idle')
  }

  function fail(attempt, message) {
    if (!isCurrent(attempt)) return
    current = null
    release(attempt)
    publish('idle', message)
  }

  async function finish(attempt) {
    if (!isCurrent(attempt)) return
    stopTracks(attempt.stream)
    attempt.stream = null
    onStream(null)
    attempt.recorder.ondataavailable = null
    attempt.recorder.onstop = null
    attempt.recorder.onerror = null
    if (!sameRoom(attempt)) return cancel()
    publish('transcribing')

    try {
      // The stop event follows the final dataavailable event, so no audio is lost.
      const type = attempt.recorder.mimeType || attempt.chunks[0]?.type || 'application/octet-stream'
      const audio = new Blob(attempt.chunks, { type })
      attempt.chunks = []
      if (!audio.size) throw new Error('No audio was recorded. Try again and speak into your microphone.')

      const text = await transcribe(audio, { signal: attempt.controller.signal })
      if (!isCurrent(attempt)) return
      if (!sameRoom(attempt)) return cancel()
      if (typeof text !== 'string' || !text.trim()) {
        throw new Error('No speech was detected. Try again and speak a little more clearly.')
      }
      const state = store.getState()
      if (state.isSynthesizing) throw new Error('Another synthesis is running. Wait for it to finish, then record again.')
      if (state.input !== attempt.input) throw new Error('Your note changed while transcribing. Record again to use voice input.')

      current = null
      release(attempt)
      publish('idle')
      state.setInput(text.trim())
      await store.getState().synthesize()
    } catch (error) {
      fail(attempt, error?.message || 'Could not transcribe your recording. Please try again.')
    }
  }

  async function start() {
    // A synchronous latch also guards double clicks before React re-renders.
    if (disposed || current) return
    const state = store.getState()
    if (state.isSynthesizing) return
    if (!state.roomId || !state.username) {
      publish('idle', 'Enter your name and join a room before recording.')
      return
    }
    if (!mediaDevices?.getUserMedia || !Recorder) {
      publish('idle', 'Voice recording needs a supported browser on HTTPS or localhost.')
      return
    }

    const attempt = {
      roomId: state.roomId,
      roomVersion: state.roomVersion,
      username: state.username,
      input: state.input,
      stream: null,
      recorder: null,
      chunks: [],
      controller: new AbortController(),
    }
    current = attempt
    publish('requesting')

    try {
      const stream = await mediaDevices.getUserMedia({ audio: true })
      // Permission prompts cannot be aborted. Release a late-granted stream.
      if (!isCurrent(attempt)) {
        stopTracks(stream)
        return
      }
      attempt.stream = stream
      onStream(stream)
      if (!sameRoom(attempt)) return cancel()
      if (store.getState().isSynthesizing) {
        fail(attempt, 'Wait for the current synthesis to finish before recording.')
        return
      }
      const mimeType = AUDIO_TYPES.find((type) => Recorder.isTypeSupported?.(type))
      const recorder = new Recorder(stream, mimeType ? { mimeType } : undefined)
      attempt.recorder = recorder
      recorder.ondataavailable = (event) => {
        if (isCurrent(attempt) && event.data?.size > 0) attempt.chunks.push(event.data)
      }
      recorder.onstop = () => finish(attempt)
      recorder.onerror = () => fail(attempt, 'Recording was interrupted. Check your microphone and try again.')
      recorder.start(250)
      if (isCurrent(attempt)) publish('recording')
    } catch (error) {
      fail(attempt, microphoneError(error))
    }
  }

  function stop() {
    if (!current || status !== 'recording') return
    const attempt = current
    publish('transcribing')
    try {
      if (attempt.recorder.state !== 'inactive') attempt.recorder.stop()
      stopTracks(attempt.stream)
      attempt.stream = null
      onStream(null)
    } catch {
      fail(attempt, 'Could not finish recording. Please try again.')
    }
  }

  const unsubscribe = store.subscribe(() => {
    if (current && !sameRoom(current)) cancel()
  })

  return {
    start,
    stop,
    cancel,
    dismissError: () => publish(status),
    destroy() {
      disposed = true
      unsubscribe()
      cancel()
    },
  }
}
