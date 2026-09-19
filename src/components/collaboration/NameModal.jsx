import { useId, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { normalizeUsername } from '../../lib/collaboration'
import Modal from './Modal'

export default function NameModal({ open, onJoin }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const inputId = useId()
  const hintId = useId()
  const normalizedName = normalizeUsername(name)

  function handleSubmit(event) {
    event.preventDefault()
    if (normalizedName) onJoin(normalizedName)
  }

  return (
    <Modal
      open={open}
      eyebrow="Join a room"
      title="Join this workspace"
      description="Enter your name to join the collision. It will appear alongside the ideas you contribute."
      initialFocusRef={inputRef}
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="mb-2.5 block text-xs font-medium text-ink">
          Your name
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            name="username"
            type="text"
            autoComplete="nickname"
            enterKeyHint="go"
            maxLength={40}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={hintId}
            placeholder="e.g. Aryan"
            className="h-12 w-full rounded-[3px] border border-teal/30 bg-void/55 px-3.5 text-base text-ink outline-none transition-colors placeholder:text-muted/55 focus:border-bronze focus:ring-1 focus:ring-bronze/30 sm:text-sm"
          />
        </div>
        <p id={hintId} className="mt-2.5 text-xs leading-relaxed text-muted">
          Up to 40 characters. Remembered on this device.
        </p>
        <button
          type="submit"
          disabled={!normalizedName}
          className="group mt-7 flex min-h-11 w-full items-center justify-between gap-3 rounded-[3px] border border-bronze bg-bronze px-4 py-3 text-sm font-medium text-void transition-colors hover:border-ink/40 hover:bg-bronze/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze disabled:cursor-not-allowed disabled:border-teal/15 disabled:bg-void/25 disabled:text-muted/50"
        >
          Enter the room
          <ArrowRight aria-hidden="true" className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
        </button>
      </form>
    </Modal>
  )
}
