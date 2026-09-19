import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGraphStore } from '../store/useGraphStore'
import { roomLocation } from '../lib/collaboration'

/** Mount once inside the dashboard route, under BrowserRouter. */
export default function useRoomSession() {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  const roomId = useGraphStore((s) => s.roomId)
  const username = useGraphStore((s) => s.username)
  const setRoomId = useGraphStore((s) => s.setRoomId)
  const setUsername = useGraphStore((s) => s.setUsername)
  const generatedRoom = useRef(null)

  useEffect(() => {
    const session = roomLocation({ pathname, search, hash }, generatedRoom.current)
    setRoomId(session.roomId)
    if (session.replacement) {
      // StrictMode replays effects; keep the generated ID stable until navigation commits.
      generatedRoom.current = session.roomId
      navigate(session.replacement, { replace: true })
    } else {
      generatedRoom.current = null
    }
  }, [pathname, search, hash, navigate, setRoomId])

  const urlRoomId = new URLSearchParams(search).get('room')?.trim()
  const roomReady = Boolean(roomId && roomId === urlRoomId)

  return {
    roomId,
    username,
    roomReady,
    needsName: roomReady && !username,
    joinRoom: setUsername,
  }
}
