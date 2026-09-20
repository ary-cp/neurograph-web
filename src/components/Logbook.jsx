import { useEffect, useState } from 'react'
import { Mic, Square, Loader2, X, AlertTriangle, ArrowUpRight, Zap } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore'
import useVoiceInput from '../hooks/useVoiceInput'
import { INTENT_META } from '../lib/kinds'
import Waveform from './Waveform'
import { Kbd, pad2, clock, relativeTime } from './ui'

const EXAMPLE =
  'Remote work gives people more time to focus, but fewer spontaneous conversations. How can teams protect deep work without losing the chance encounters that lead to new ideas?'

const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi
/** A client-side guess so the strip can react while you type; the server's verdict wins after synthesis. */
function guessIntent(text) {
  if (!text.trim()) return null
  if (URL_RE.test(text)) return 'research'
  if (/\?|\b(what if|should we|how might|ideas? for|could we|not sure)\b/i.test(text)) return 'brainstorm'
  return 'analytical'
}

function useTimer(running) {
  const [s, setS] = useState(0)
  useEffect(() => {
    if (!running) { setS(0); return }
    const t = setInterval(() => setS((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}

function VoiceControl({ voice, disabled }) {
  const recording = voice.status === 'recording'
  const timer = useTimer(recording)
  if (recording) {
    return (
      <div className="flex items-center gap-2 rounded-[3px] border border-collision/40 bg-collision/[0.06] pl-2 pr-1 py-1">
        <span className="rec-dot size-1.5 rounded-full bg-collision" aria-hidden="true" />
        <Waveform stream={voice.stream} />
        <span className="readout text-ink">{timer}</span>
        <button type="button" onClick={voice.stop} aria-label="Stop recording and synthesize" className="ml-1 grid size-7 place-items-center rounded-[2px] bg-collision/90 text-void hover:bg-collision">
          <Square className="size-3 fill-current" aria-hidden="true" />
        </button>
      </div>
    )
  }
  const busy = voice.busy
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={voice.start}
        disabled={disabled || !voice.supported || busy}
        title={voice.supported ? 'Record a voice note — it is transcribed by Whisper and synthesized' : 'Voice needs HTTPS or localhost in a supported browser'}
        className="inline-flex h-8 items-center gap-2 rounded-[3px] border border-hairline px-2.5 text-[11.5px] text-muted transition-colors hover:border-teal/60 hover:bg-teal/10 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
      >
        {busy ? <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden="true" /> : <Mic className="size-3.5" strokeWidth={1.5} aria-hidden="true" />}
        {voice.status === 'transcribing' ? 'Transcribing…' : voice.status === 'requesting' ? 'Mic…' : 'Voice'}
      </button>
      {busy && (
        <button type="button" onClick={voice.cancel} className="h-8 rounded-[3px] px-2 text-[11px] text-muted hover:text-ink" aria-label="Cancel voice input">
          cancel
        </button>
      )}
    </div>
  )
}

function Entry({ entry, no, focusNodes, setHighlight }) {
  const ok = entry.research?.filter((r) => r.ok).length ?? 0
  const intent = entry.intent ? INTENT_META[entry.intent] : null
  return (
    <button
      type="button"
      onClick={() => focusNodes(entry.nodeIds)}
      onMouseEnter={() => setHighlight(entry.nodeIds)}
      onMouseLeave={() => setHighlight([])}
      onFocus={() => setHighlight(entry.nodeIds)}
      onBlur={() => setHighlight([])}
      title="Show these ideas on the chart"
      className="group w-full border-t border-hairline px-1.5 py-3 text-left transition-colors hover:bg-teal/[0.06] focus-visible:bg-teal/[0.06]"
    >
      <div className="flex items-center gap-2.5 readout text-muted/70">
        <span className="text-bronze">№ {pad2(no)}</span>
        <span>{relativeTime(entry.at)}</span>
        <span className="truncate">{entry.author}</span>
        {intent && <span className="ml-auto shrink-0 uppercase tracking-[0.12em]" style={{ color: intent.hex }}>{intent.label}</span>}
      </div>
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.55] text-ink/85">{entry.text}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 readout text-muted/60">
        <span>+{entry.stats?.nodes ?? 0} ideas</span>
        <span>{entry.stats?.edges ?? 0} links</span>
        {entry.stats?.contradictions > 0 && (
          <span className="inline-flex items-center gap-1 text-collision"><Zap className="size-2.5" aria-hidden="true" />{entry.stats.contradictions}</span>
        )}
        {entry.research?.length > 0 && (
          <span className={`inline-flex items-center gap-1 ${ok ? 'text-sage' : 'text-collision'}`} title={entry.research.map((r) => (r.ok ? `✓ ${r.title}` : `✗ ${r.url} — ${r.error}`)).join('\n')}>
            <ArrowUpRight className="size-2.5" aria-hidden="true" />{ok}/{entry.research.length} sources
          </span>
        )}
        {entry.meta?.latencyMs != null && <span className="ml-auto">{entry.meta.latencyMs} ms</span>}
      </div>
    </button>
  )
}

export default function Logbook({ collapsed }) {
  const input = useGraphStore((s) => s.input)
  const setInput = useGraphStore((s) => s.setInput)
  const synthesize = useGraphStore((s) => s.synthesize)
  const isSynthesizing = useGraphStore((s) => s.isSynthesizing)
  const error = useGraphStore((s) => s.error)
  const dismissError = useGraphStore((s) => s.dismissError)
  const entries = useGraphStore((s) => s.entries)
  const roomId = useGraphStore((s) => s.roomId)
  const username = useGraphStore((s) => s.username)
  const focusNodes = useGraphStore((s) => s.focusNodes)
  const setHighlight = useGraphStore((s) => s.setHighlight)
  const loadDemo = useGraphStore((s) => s.loadDemo)
  const loadPitch = useGraphStore((s) => s.loadPitch)
  const voice = useVoiceInput()

  const busy = isSynthesizing || voice.busy
  const ready = Boolean(roomId && username)
  const inputError = voice.error || error
  const links = (input.match(URL_RE) ?? []).length
  const guess = guessIntent(input)
  const today = new Date().toLocaleDateString([], { day: '2-digit', month: 'short' })

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!busy) synthesize()
    }
  }

  return (
    <aside
      aria-label="Logbook"
      className={`relative z-30 flex h-full min-h-0 flex-col border-hairline bg-surface/40 backdrop-blur-sm transition-[width] duration-300 ease-expo
        max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[58%] max-md:border-t max-md:bg-void/95
        md:border-r ${collapsed ? 'w-0 overflow-hidden border-r-0 max-md:hidden' : 'w-full md:w-[340px]'}`}
    >
      <div className="flex h-full min-h-0 w-full flex-col md:w-[340px]">
        <div className="flex items-end justify-between px-5 pb-3 pt-4">
          <div>
            <p className="eyebrow">Logbook</p>
            <h2 className="font-display mt-1 text-[24px] font-normal leading-none text-ink">Entries</h2>
          </div>
          <span className="readout text-muted/60">next № {pad2(entries.length + 1)}</span>
        </div>

        {/* composer */}
        <div className="mx-4 flex shrink-0 flex-col rounded-[3px] border border-hairline bg-void/40 transition-colors focus-within:border-bronze/60">
          <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2 readout text-muted/70">
            <span>{today} · {username || 'unsigned'}</span>
            <span>{input.length} ch</span>
          </div>
          <label htmlFor="collision-note" className="sr-only">New entry</label>
          <textarea
            id="collision-note"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            aria-invalid={Boolean(inputError)}
            placeholder="A note, a claim, a doubt. Paste a link and it will be read live."
            className="ruled min-h-[150px] w-full resize-none bg-transparent px-3.5 pb-3 pt-[6px] text-[14px] tracking-[-0.01em] text-ink caret-bronze outline-none placeholder:text-muted/45 disabled:opacity-60"
          />
          <div className="flex min-h-[30px] items-center gap-3 border-t border-hairline px-3.5 py-1.5 readout text-muted/70">
            {links > 0 ? (
              <span className="truncate text-sage">● {links} {links === 1 ? 'link' : 'links'} → read live</span>
            ) : guess ? (
              <span className="truncate">reads as <span style={{ color: INTENT_META[guess].hex }}>{guess}</span></span>
            ) : (
              <span className="truncate text-muted/40">the model picks a mode as it reads</span>
            )}
            {!input.trim() && !busy && (
              <span className="ml-auto flex shrink-0 gap-3 whitespace-nowrap">
                <button type="button" onClick={() => setInput(EXAMPLE)} className="text-bronze hover:text-ink">try an example</button>
                <button type="button" onClick={loadDemo} className="text-muted/70 hover:text-ink">load demo</button>
                {window.location.hostname === 'localhost' && (
                  <button type="button" onClick={loadPitch} className="text-teal hover:text-ink font-medium">load pitch deck</button>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-hairline px-2.5 py-2">
            <VoiceControl voice={voice} disabled={isSynthesizing || !ready} />
            <div className="flex-1" />
            <button
              type="button"
              onClick={synthesize}
              disabled={busy || !input.trim() || !ready}
              className="group inline-flex h-9 items-center gap-2.5 rounded-[3px] border border-bronze bg-bronze pl-3.5 pr-2 text-[12.5px] font-semibold text-void transition-colors hover:bg-[#b58f68] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {isSynthesizing ? <><Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden="true" /> Reading…</> : 'Synthesize'}
              <Kbd className="!border-void/25 !bg-void/15 !text-void/80">⌘↵</Kbd>
            </button>
          </div>
        </div>

        {inputError && (
          <div role="alert" className="mx-4 mt-3 flex shrink-0 items-start gap-2 rounded-[3px] border border-collision/30 bg-collision/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-ink">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-collision" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words">{inputError}</span>
            <button type="button" onClick={() => { voice.dismissError(); dismissError() }} className="text-muted hover:text-ink" aria-label="Dismiss">
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* entries */}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {entries.length === 0 ? (
            <div className="border-t border-hairline px-1.5 pt-4">
              <p className="text-[12px] leading-[1.7] text-muted/70">
                No entries yet. The first one seeds the chart; every one after it is compared with what is already there.
              </p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <Entry key={entry.id} entry={entry} no={entries.length - i} focusNodes={focusNodes} setHighlight={setHighlight} />
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
