/** Tiny shared primitives so the chrome stays consistent without a component library. */
export function IconButton({ label, active = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-8 place-items-center rounded-[3px] border transition-colors disabled:opacity-35 ${active ? 'border-bronze/60 bg-bronze/10 text-ink' : 'border-transparent text-muted hover:border-hairline hover:bg-teal/10 hover:text-ink'} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function GhostButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 items-center gap-2 rounded-[3px] border border-hairline px-2.5 text-[11.5px] text-ink transition-colors hover:border-teal/60 hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-35 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Kbd({ children, className = '' }) {
  return <kbd className={`kbd ${className}`}>{children}</kbd>
}

export const pad2 = (n) => String(n ?? 0).padStart(2, '0')
export const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const relativeTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const mos = Math.floor(days / 30);
  if (mos < 12) return `${mos}mo`;
  return `${Math.floor(mos / 12)}y`;
}
