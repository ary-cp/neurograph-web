import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

/** Native modal dialogs keep the canvas inert and contain keyboard focus. */
export default function Modal({ open, onClose, eyebrow, title, description, children, initialFocusRef }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    if (!dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    initialFocusRef?.current?.focus({ preventScroll: true })

    return () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [open, initialFocusRef])

  function handleBackdropClick(event) {
    if (!onClose || event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom
    if (outside) onClose()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose?.()
      }}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md overflow-y-auto overscroll-contain rounded-[6px] border border-teal/30 bg-[color-mix(in_srgb,var(--color-panel)_75%,var(--color-void))] p-0 text-ink outline-none backdrop:bg-void/85 backdrop:backdrop-blur-sm"
    >
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open || reduceMotion ? 0 : 10 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        className="relative isolate overflow-hidden p-6 sm:p-8"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-sm text-muted transition-colors hover:bg-teal/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
        {eyebrow && <p className="mb-5 pr-7 font-mono text-[10px] uppercase tracking-[0.15em] text-bronze">{eyebrow}</p>}
        <h2 id={titleId} className="max-w-[330px] pr-5 font-display text-[28px] font-normal leading-[1.15] tracking-[-0.025em] text-ink sm:text-[32px]">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-3 text-[13px] leading-[1.7] text-muted">
            {description}
          </p>
        )}
        <div className="mt-7">{children}</div>
      </motion.div>
    </dialog>,
    document.body,
  )
}
