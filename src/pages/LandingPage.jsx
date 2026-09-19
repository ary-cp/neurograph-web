import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import Brand from '../components/Brand'

function Reveal({ children, className, delay = 0 }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function WorkspaceLink({ children = 'Start synthesizing', className = '' }) {
  return (
    <Link
      to="/app"
      className={`group inline-flex items-center justify-between gap-8 rounded-md border border-bronze bg-bronze px-5 py-3.5 text-[13px] font-semibold text-void transition-colors hover:border-ink hover:bg-ink ${className}`}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  )
}

function DiagramNode({ x, y, width = 175, number, kind, label, accent = '#7f9e9d' }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={width} height="70" rx="6" fill="#12313b" stroke="#7f9e9d" strokeOpacity="0.4" />
      <path d={`M0 16 V6 Q0 0 6 0 H24`} fill="none" stroke={accent} strokeWidth="1.5" />
      <text x="15" y="23" fill={accent} fontSize="8" letterSpacing="1.2" fontFamily="'JetBrains Mono', monospace">{kind}</text>
      <text x={width - 14} y="23" textAnchor="end" fill="#7f9e9d" fontSize="8" fontFamily="'JetBrains Mono', monospace">{number}</text>
      <text x="15" y="49" fill="#e8e5da" fontSize="12" fontWeight="500" fontFamily="Inter, sans-serif">{label}</text>
      <circle cx="0" cy="35" r="2.5" fill={accent} />
      <circle cx={width} cy="35" r="2.5" fill={accent} />
    </g>
  )
}

/** An explicitly illustrative example; independent of the live graph store. */
function FieldStudy() {
  const relations = [
    'M206 159 C246 159 221 65 261 65',
    'M206 159 C250 159 217 274 261 274',
    'M436 65 C479 65 482 146 485 174',
  ]
  return (
    <figure className="relative min-w-0 border-y border-teal/25 bg-panel/[0.14] sm:border sm:rounded-lg">
      <figcaption className="flex items-center justify-between gap-3 border-b border-teal/15 px-5 py-4 sm:px-6">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Field study / 001</span>
        <span className="text-[11px] text-teal">The remote-work paradox</span>
      </figcaption>
      <div className="mx-5 mt-6 border-l-2 border-bronze/60 pl-4 sm:mx-6">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-bronze">The original thought</span>
        <p className="mt-2 max-w-[400px] font-display text-[19px] leading-[1.55] text-ink/90 sm:text-[21px]">
          “More time to focus. Fewer conversations.<br className="hidden sm:block" /> Are we doing our best work?”
        </p>
      </div>
      <svg
        viewBox="0 0 590 342"
        role="img"
        aria-label="An illustrative graph connects remote work to deep focus and team collaboration. Focus supports productivity, while reduced collaboration raises a contradiction."
        className="my-3 w-full"
      >
        <defs>
          <pattern id="field-study-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#7f9e9d" fillOpacity="0.2" />
          </pattern>
        </defs>
        <rect width="590" height="342" fill="url(#field-study-dots)" />
        {relations.map((d) => (
          <g key={d} fill="none" stroke="#477684">
            <path d={d} strokeWidth="1.3" />
            <path d={d} pathLength="100" className="idea-pulse" strokeWidth="2.3" strokeLinecap="round" style={{ '--edge-accent': '#477684' }} />
          </g>
        ))}
        <path d="M436 274 C484 274 485 260 485 244" fill="none" stroke="#f43f5e" strokeOpacity="0.7" strokeDasharray="3 5" />
        <path d="M436 274 C484 274 485 260 485 244" pathLength="100" className="idea-pulse idea-pulse--collision" fill="none" stroke="#f43f5e" strokeWidth="2.3" strokeLinecap="round" style={{ '--edge-accent': '#f43f5e' }} />
        <g fill="#acc0bb" fontSize="8" fontFamily="'JetBrains Mono', monospace">
          <text x="226" y="101" transform="rotate(-64 226 101)">enables</text>
          <text x="225" y="218" transform="rotate(65 225 218)">reduces</text>
          <text x="476" y="116" transform="rotate(65 476 116)">supports</text>
        </g>
        <DiagramNode x={31} y={124} kind="TOPIC" number="01" label="Remote work" accent="#a8815b" />
        <DiagramNode x={261} y={30} kind="CONCEPT" number="02" label="Deep focus" />
        <DiagramNode x={261} y={239} kind="CONCEPT" number="03" label="Team collaboration" />
        <DiagramNode x={398} y={174} width={173} kind="CLAIM" number="04" label="Productivity" accent="#748753" />
        <g transform="translate(455 291)">
          <circle cx="0" cy="0" r="3" fill="#f43f5e" />
          <text x="9" y="3" fill="#acc0bb" fontSize="8" fontFamily="Inter, sans-serif">a contradiction</text>
        </g>
      </svg>
      <div className="grid grid-cols-[28px_1fr] gap-3 border-t border-teal/15 px-5 py-5 sm:px-6">
        <span className="pt-0.5 font-display text-xl italic text-bronze">↳</span>
        <p className="text-[12px] leading-[1.8] text-muted">
          <span className="text-ink">Something worth questioning.</span><br />
          More focus doesn’t always mean better collaboration.
        </p>
      </div>
    </figure>
  )
}

function RelationSample() {
  return (
    <div className="flex min-h-36 flex-col justify-center gap-3 py-4 sm:py-7" aria-label="Example relation: remote work enables deep focus">
      <div className="flex items-center gap-3 text-[12px]">
        <span className="size-1.5 rounded-full bg-bronze" /> Remote work
      </div>
      <div className="ml-[3px] flex items-center gap-4 border-l border-ocean py-3 pl-6 font-mono text-[9px] text-teal">
        enables <span aria-hidden="true" className="h-px flex-1 bg-ocean/40" />
      </div>
      <div className="flex items-center gap-3 pl-7 text-[12px]">
        <span className="size-1.5 rounded-full bg-teal" /> Deep focus
      </div>
    </div>
  )
}

function ContradictionSample() {
  return (
    <div className="flex min-h-36 flex-col justify-center py-4 sm:py-7">
      <p className="border-b border-teal/20 pb-4 font-display text-lg text-muted">“More information is better.”</p>
      <div className="flex items-start gap-3 pt-4">
        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-collision" />
        <p className="font-display text-lg text-ink">“Clarity comes from less.”</p>
      </div>
    </div>
  )
}

function VoiceSample() {
  const bars = [5, 13, 9, 19, 30, 17, 37, 46, 29, 40, 53, 31, 44, 23, 33, 17, 28, 12, 20, 8, 12]
  return (
    <div className="flex min-h-36 flex-col justify-center py-4 sm:py-7">
      <div aria-hidden="true" className="flex h-16 items-center gap-[5px]">
        {bars.map((height, i) => <span key={i} style={{ height }} className="w-0.5 rounded-full bg-sage/80" />)}
      </div>
      <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-teal">Spoken thought → connected idea</p>
    </div>
  )
}

const capabilities = [
  { number: '01', category: 'Graph-RAG', title: 'Keep the context.', description: 'A note rarely stands alone. Map its concepts, claims, and relationships so the next thought has something to build on.', visual: RelationSample },
  { number: '02', category: 'Gap detection', title: 'Notice the disagreement.', description: 'Put conflicting ideas in the same frame. Follow the connection, inspect the evidence, and find a better question to ask.', visual: ContradictionSample },
  { number: '03', category: 'Voice-to-Graph', title: 'Leave room for a ramble.', description: 'Some thoughts arrive before the right words do. Speak one; Whisper transcribes it and the chart absorbs it like any other entry.', visual: VoiceSample },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-ink">
      <header className="sticky top-0 z-40 border-b border-teal/20 bg-void/95 backdrop-blur-md">
        <nav aria-label="Main navigation" className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-14">
          <Brand />
          <div className="hidden items-center gap-8 text-[12px] text-muted md:flex">
            <a href="#approach" className="transition-colors hover:text-ink">The approach</a>
            <a href="#field-notes" className="transition-colors hover:text-ink">Field notes</a>
          </div>
          <Link to="/app" className="group inline-flex shrink-0 items-center gap-2 border-b border-bronze/50 py-2 text-[11px] text-ink transition-colors hover:border-ink sm:gap-5 sm:text-[12px]">
            Open the lab <ArrowUpRight aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none">
        <section aria-labelledby="hero-title" className="mx-auto max-w-[1440px] px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-14 lg:pb-20 lg:pt-20">
          <div className="mb-10 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.15em] text-teal lg:mb-14">
            <span className="text-bronze">A workspace for connected thinking</span>
            <span aria-hidden="true" className="h-px flex-1 bg-teal/20" />
            <span className="hidden sm:inline">Notes, with perspective.</span>
          </div>
          <div className="grid items-start gap-12 lg:grid-cols-[1.03fr_1fr] lg:gap-12 xl:gap-20">
            <Reveal className="pt-1 lg:pt-7">
              <h1 id="hero-title" className="max-w-[600px] font-display text-[clamp(3.25rem,5.5vw,5.25rem)] font-normal leading-[1.02] tracking-[-0.055em]">
                Don’t just<br />store notes.<br />
                <em className="text-bronze">Collide them.</em>
              </h1>
              <p className="mt-7 max-w-[350px] text-[14px] leading-[1.9] text-muted sm:text-[15px] lg:mt-9">
                A thought becomes useful when it meets another.
                NeuroGraph uses AI to find the relationships, gaps, and contradictions hiding in your notes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-5 lg:mt-10">
                <WorkspaceLink />
                <a href="#approach" className="inline-flex items-center gap-2 py-2 text-[11px] text-muted transition-colors hover:text-ink">
                  Explore the approach <ArrowDown aria-hidden="true" className="size-3" />
                </a>
              </div>
              <p className="mt-8 text-[11px] text-teal lg:mt-12">Start with a sentence. See what it connects to.</p>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0"><FieldStudy /></Reveal>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-3 border-t border-teal/20 pt-5 text-[10px] text-teal sm:grid-cols-2 sm:gap-6 lg:mt-20">
            <span>An idea-collision engine. A little less certainty. A little more curiosity.</span>
            <span className="flex items-center gap-2 sm:justify-end"><span className="size-1 rounded-full bg-sage" />Built around the connections, not the folders.</span>
          </div>
        </section>

        <section id="approach" aria-labelledby="approach-title" className="scroll-mt-24 border-y border-teal/20 bg-panel/[0.15]">
          <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
            <Reveal className="grid gap-6 pb-10 md:grid-cols-[1fr_2fr] md:gap-12 md:pb-14">
              <p className="pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-bronze">The approach / 01—03</p>
              <div className="max-w-[620px]">
                <h2 id="approach-title" className="font-display text-[34px] font-normal leading-[1.13] tracking-[-0.035em] sm:text-[46px]">Good thinking rarely<br />travels in a straight line.</h2>
                <p className="mt-5 max-w-[405px] text-[13px] leading-[1.9] text-muted">A working space for the unfinished thought, the useful contradiction, and the connection you hadn’t made yet.</p>
              </div>
            </Reveal>
            <div>
              {capabilities.map(({ number, category, title, description, visual: Visual, soon }) => (
                <Reveal key={number} className="grid gap-5 border-t border-teal/20 py-7 sm:py-9 md:grid-cols-[1fr_1fr_1fr] md:gap-12">
                  <div className="flex items-start gap-4 md:gap-6">
                    <span className="pt-0.5 font-mono text-[10px] text-bronze">{number}</span>
                    <div>
                      <h3 className="text-[13px] font-medium">{category}</h3>
                      {soon && <span className="mt-2 inline-block text-[10px] text-teal">In development</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-[25px] leading-tight tracking-[-0.02em] text-ink">{title}</p>
                    <p className="mt-4 max-w-[310px] text-[12px] leading-[1.9] text-muted">{description}</p>
                  </div>
                  <div className="min-w-0 border-l border-teal/20 pl-6 md:pl-8"><Visual /></div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="field-notes" aria-labelledby="field-notes-title" className="mx-auto grid max-w-[1440px] scroll-mt-24 gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:px-14">
          <Reveal>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-bronze">A note on the process</p>
            <h2 id="field-notes-title" className="mt-5 font-display text-[32px] leading-[1.15] tracking-[-0.03em]">Bring a thought.<br />Leave with a question.</h2>
          </Reveal>
          <Reveal className="grid gap-8 sm:grid-cols-3 sm:gap-7">
            {[
              ['01', 'Write it down.', 'A meeting note, a loose observation, a claim you’re not quite convinced by.'],
              ['02', 'Read the connections.', 'Watch the graph take shape. Explore how one idea supports or challenges another.'],
              ['03', 'Keep following.', 'Inspect a node. Add a thought. Use the contradiction as a place to begin again.'],
            ].map(([number, title, description]) => (
              <div key={number} className="border-t border-teal/30 pt-4">
                <span className="font-mono text-[9px] text-teal">{number}</span>
                <h3 className="mb-3 mt-6 text-[13px] font-medium">{title}</h3>
                <p className="text-[12px] leading-[1.9] text-muted">{description}</p>
              </div>
            ))}
          </Reveal>
        </section>

        <section aria-labelledby="invitation-title" className="border-y border-teal/20">
          <div className="mx-auto grid max-w-[1440px] items-center gap-9 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-[1fr_auto] lg:px-14">
            <Reveal>
              <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.16em] text-teal">An open invitation</p>
              <h2 id="invitation-title" className="font-display text-[36px] font-normal leading-[1.13] tracking-[-0.035em] sm:text-[48px]">What’s on your mind?</h2>
            </Reveal>
            <WorkspaceLink className="justify-self-start md:justify-self-end">Take it to the lab</WorkspaceLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-7 text-[10px] text-teal sm:px-8 lg:px-14">
        <p>NeuroGraph © {new Date().getFullYear()}</p>
        <p className="hidden sm:block">A place for ideas to meet.</p>
        <a href="#main-content" className="inline-flex items-center gap-3 transition-colors hover:text-ink">Back to the top <ArrowRight aria-hidden="true" className="size-3 -rotate-90" /></a>
      </footer>
    </div>
  )
}
