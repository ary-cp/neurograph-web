import { useEffect } from 'react'
import { useGraphStore } from '../store/useGraphStore'

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

/**
 * ⌘/Ctrl+↵ synthesize · ⌘K commands · ⌘/ logbook · ⌘I inspector · ? shortcuts · F fit · C next collision · Esc close
 */
export default function useHotkeys({ onFit }) {
  useEffect(() => {
    const onKey = (e) => {
      const s = useGraphStore.getState()
      const mod = e.metaKey || e.ctrlKey
      const typing = isTyping(document.activeElement)

      if (mod && e.key === 'Enter') { e.preventDefault(); if (!s.isSynthesizing) s.synthesize(); return }
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); s.setPalette(!s.ui.palette); return }
      if (mod && e.key === '/') { e.preventDefault(); s.toggleLogbook(); return }
      if (mod && e.key.toLowerCase() === 'i') { e.preventDefault(); s.toggleInspector(); return }
      if (e.key === 'Escape') {
        if (s.ui.palette) s.setPalette(false)
        else if (s.ui.shortcuts) s.setShortcuts(false)
        else if (s.ui.inspector && !typing) s.setInspector(false)
        return
      }
      if (typing || mod || e.altKey) return
      if (e.key === '?') { e.preventDefault(); s.setShortcuts(!s.ui.shortcuts); return }
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); onFit?.(); return }
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); s.nextCollision(); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFit])
}
