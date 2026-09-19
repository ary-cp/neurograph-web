export const USERNAME_STORAGE_KEY = 'username'

export function normalizeUsername(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40).trim()
}

export function readSavedUsername() {
  try {
    return normalizeUsername(globalThis.localStorage?.getItem(USERNAME_STORAGE_KEY))
  } catch {
    return ''
  }
}

export function saveUsername(value) {
  try {
    globalThis.localStorage?.setItem(USERNAME_STORAGE_KEY, value)
  } catch {
    // Private/restricted browsers can still join with an in-memory identity.
  }
}

export function createRoomId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6))
  const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `room-${random.slice(0, 6)}-${random.slice(6)}`
}

/** Preserve other query parameters and the hash when adding a room. */
export function roomLocation(location, generatedRoomId) {
  const params = new URLSearchParams(location.search)
  const existingRoomId = params.get('room')?.trim()
  if (existingRoomId) return { roomId: existingRoomId, replacement: null }

  const roomId = generatedRoomId || createRoomId()
  params.set('room', roomId)
  return {
    roomId,
    replacement: { pathname: location.pathname, search: `?${params}`, hash: location.hash },
  }
}
