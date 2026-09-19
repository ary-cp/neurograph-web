# Collision room setup

The room routing, name dialog, QR sharing, and synthesis payload changes are already mounted in the application. `react-qr-code` is installed and recorded in `package.json` and the lockfile. To add the dependency to another checkout, run `npm install react-qr-code`.

## Mounting

`src/App.jsx` provides `BrowserRouter` and renders `DashboardLayout` at `/app`. Call `useRoomSession()` once in that layout, inside the router. The hook adds a cryptographically random room ID when `?room=` is absent or empty, replaces the current history entry without reloading, preserves other query parameters and the hash, and saves the room ID in Zustand.

`src/layouts/DashboardLayout.jsx` already contains the header Share button and both dialogs. Their mounting contract is:

```jsx
const { roomId, roomReady, needsName, joinRoom } = useRoomSession()
const [shareOpen, setShareOpen] = useState(false)

// Inside the layout's returned JSX:
<NameModal open={needsName} onJoin={joinRoom} />
<ShareModal
  open={shareOpen && roomReady && !needsName}
  onClose={() => setShareOpen(false)}
  roomId={roomId}
  url={roomReady ? window.location.href : ''}
/>
```

Import the hook from `src/hooks/useRoomSession.js` and the default modal exports from `src/components/collaboration/NameModal.jsx` and `ShareModal.jsx`. The Share button calls `setShareOpen(true)` and stays disabled until the room and name are ready. Do not mount a second copy in `App.jsx`.

The shared `Modal.jsx` renders a native `<dialog>` through a portal into `document.body`. It contains keyboard focus and makes the underlying dashboard inert. The name dialog requires a name; the Share dialog supports its close button, Escape, and clicking the backdrop. Clipboard failures expose the selectable link for manual copying.

## Identity and requests

The store reads the `username` localStorage key on initialization. `setUsername` normalizes whitespace and control characters, trims the value to at most 40 characters, and saves it to both localStorage and Zustand. If browser storage is unavailable, identity still works for the current session.

`useGraphStore.synthesize()` keeps the existing graph context and extraction flow and sends:

```js
{
  text: `[${username}]: ${input.trim()}`,
  room_id: roomId,
  existingNodes,
  origin: computeOrigin(nodes),
  persist: true,
}
```

Switching rooms retains separate graph and draft snapshots in browser memory for the current session. These snapshots are not shared storage and do not survive a page reload. The room version check ignores stale synthesis responses after switching rooms, including an A → B → A sequence.

## Collaboration scope

This frontend work establishes identity, room links, and attributed requests. It does **not** implement live graph synchronization between participants.

The current sibling backend already validates `room_id` in `neurograph-server/src/schemas/graph.schema.js`, passes it to note persistence, and exposes `GET /api/room/:roomId`. Persistence and room loading require configured Supabase storage. The frontend's `getRoomGraph` API helper exists, but the dashboard does not yet call it to hydrate a room or subscribe to other participants' updates. Completing multiplayer requires wiring room loading and a room-scoped subscription/broadcast or polling mechanism, with consistent merging and room-change cleanup.

The QR code encodes the current browser URL. A `localhost` or `127.0.0.1` link points to the receiving device itself; sharing with a phone or another computer requires a reachable HTTPS deployment or a correctly configured LAN URL. No public deployment is performed by these changes.

## Verification

Run from `neurograph/`:

```sh
node --test tests/collaboration.test.mjs
npm run build
npm run lint
```

For a manual check, open `/app` without a room query, join with a name, open Share, and confirm the link and QR contain the generated room. Reload to confirm the saved name is reused. Navigate between two room URLs to check that local graph and input snapshots remain separate.
