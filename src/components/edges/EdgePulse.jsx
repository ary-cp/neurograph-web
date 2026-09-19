/** A decorative segment normalized to the path length; never intercepts graph input. */
export default function EdgePulse({ path, collision = false }) {
  return (
    <path
      d={path}
      pathLength={100}
      className={`idea-pulse${collision ? ' idea-pulse--collision' : ''}`}
      aria-hidden="true"
      pointerEvents="none"
    />
  )
}
