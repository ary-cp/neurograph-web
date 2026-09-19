import { Link } from 'react-router-dom'

/** A three-star constellation with one collision — the mark doubles as the favicon. */
export default function Brand({ compact = false }) {
  return (
    <Link to="/" aria-label="NeuroGraph home" className="inline-flex shrink-0 items-center gap-2.5 text-ink">
      <svg aria-hidden="true" viewBox="0 0 28 28" className="size-7" fill="none">
        <circle cx="14" cy="14" r="12.5" stroke="#a8815b" strokeOpacity=".35" />
        <path d="M8 18 14 8l6 10M8 18h12" stroke="#a8815b" strokeWidth="1.2" />
        <circle cx="8" cy="18" r="2" fill="#7f9e9d" />
        <circle cx="20" cy="18" r="2" fill="#7f9e9d" />
        <circle cx="14" cy="8" r="2.2" fill="#a8815b" />
        <circle cx="17.2" cy="13.2" r="1.5" fill="#f43f5e" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.03em]">NeuroGraph</span>
      {!compact && <span className="eyebrow hidden border-l border-hairline pl-2.5 lg:inline">Observatory</span>}
    </Link>
  )
}
