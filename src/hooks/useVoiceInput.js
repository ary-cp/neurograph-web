import { useEffect, useRef, useState } from 'react'
import { useGraphStore } from '../store/useGraphStore'
import { transcribeAudio } from '../lib/api'
import { createVoiceInput, isVoiceInputSupported } from '../lib/voiceInput'

export default function useVoiceInput() {
  const [state, setState] = useState({ status: 'idle', error: null })
  const [stream, setStream] = useState(null)
  const controller = useRef(null)

  useEffect(() => {
    const session = createVoiceInput({ store: useGraphStore, transcribe: transcribeAudio, onChange: setState, onStream: setStream })
    controller.current = session
    return () => {
      controller.current = null
      session.destroy()
    }
  }, [])

  return {
    ...state,
    stream,
    supported: isVoiceInputSupported(),
    busy: state.status !== 'idle',
    start: () => controller.current?.start(),
    stop: () => controller.current?.stop(),
    cancel: () => controller.current?.cancel(),
    dismissError: () => controller.current?.dismissError(),
  }
}
