import { useId, useRef, useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import Modal from './Modal'

export default function ShareModal({ open, onClose, url, roomId }) {
  const copyButtonRef = useRef(null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Room access"
      title="Share this room"
      description="Send this link to open the same room."
      initialFocusRef={copyButtonRef}
    >
      {open && <ShareContent key={url} url={url} roomId={roomId} copyButtonRef={copyButtonRef} />}
    </Modal>
  )
}

function ShareContent({ url, roomId, copyButtonRef }) {
  const [copyStatus, setCopyStatus] = useState('idle')
  const inputRef = useRef(null)
  const inputId = useId()

  async function copyLink() {
    if (!url) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable')
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
    } catch {
      inputRef.current?.focus()
      inputRef.current?.select()
      setCopyStatus('manual')
    }
  }

  const feedback = copyStatus === 'copied'
    ? 'Room link copied.'
    : copyStatus === 'manual'
      ? 'The link is selected. Use your device’s Copy command, or press Ctrl+C / ⌘C.'
      : 'Scan the code or copy the link to share.'

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="w-fit max-w-full rounded-[3px] border border-teal/25 bg-white p-6">
          {url ? (
            <QRCode
              value={url}
              size={208}
              level="M"
              bgColor="#ffffff"
              fgColor="#071f27"
              title="QR code to open this collision room"
              role="img"
              style={{ display: 'block', width: '100%', maxWidth: 208, height: 'auto' }}
            />
          ) : (
            <div role="status" className="grid size-52 max-w-full place-items-center text-center text-sm text-panel">
              Preparing your room link…
            </div>
          )}
        </div>
        {roomId && (
          <p className="mt-3 max-w-full break-all font-mono text-[10px] tracking-wide text-muted">
            {roomId}
          </p>
        )}
      </div>

      <label htmlFor={inputId} className="mb-2.5 mt-7 block text-xs font-medium text-ink">
        Room link
      </label>
      <div className="relative">
        <Link2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-teal" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          readOnly
          value={url || ''}
          onFocus={(event) => event.target.select()}
          className="h-11 w-full rounded-[3px] border border-teal/30 bg-void/55 pl-9 pr-3 text-base text-ink outline-none transition-colors focus:border-bronze focus:ring-1 focus:ring-bronze/30 sm:text-xs"
        />
      </div>
      <button
        ref={copyButtonRef}
        type="button"
        onClick={copyLink}
        disabled={!url}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] border border-bronze bg-bronze px-4 py-2.5 text-sm font-medium text-void transition-colors hover:border-ink/40 hover:bg-bronze/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copyStatus === 'copied' ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
        {copyStatus === 'copied' ? 'Copied' : 'Copy link'}
      </button>
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 min-h-8 text-center text-xs leading-relaxed text-muted">
        {feedback}
      </p>
    </>
  )
}
