import { useEffect, useState } from 'react'

export type Total = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; value: number }

/** How long the up/down indicator stays visible after a change. */
export const INDICATOR_MS = 4000

interface LiveStatProps {
  total: Total
  testId: string
}

interface Change {
  delta: number
  /** Distinguishes consecutive changes so the animation restarts. */
  seq: number
}

const full = new Intl.NumberFormat('en-US')

function Arrow({ up }: { up: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="live-stat__arrow"
      viewBox="0 0 10 10"
      width="0.7em"
      height="0.7em"
      fill="currentColor"
    >
      {up ? <path d="M5 1 9.5 8.5h-9z" /> : <path d="M5 9 .5 1.5h9z" />}
    </svg>
  )
}

/**
 * The `<dd>` for a total that is refreshed over time. When a refreshed value
 * differs from the previous one, the number flashes and an arrow with the
 * difference (green up, red down) appears for a few seconds.
 */
function LiveStat({ total, testId }: LiveStatProps) {
  const value = total.status === 'loaded' ? total.value : null
  const [lastValue, setLastValue] = useState<number | null>(null)
  const [change, setChange] = useState<Change | null>(null)

  // Derived during render (not in an effect) so the indicator appears in the
  // same paint as the new number.
  if (value !== null && value !== lastValue) {
    setLastValue(value)
    if (lastValue !== null) {
      setChange({ delta: value - lastValue, seq: (change?.seq ?? 0) + 1 })
    }
  }

  const seq = change?.seq
  useEffect(() => {
    if (seq === undefined) return
    const timer = setTimeout(() => setChange(null), INDICATOR_MS)
    return () => clearTimeout(timer)
  }, [seq])

  const direction = change ? (change.delta > 0 ? 'up' : 'down') : null

  return (
    <dd
      // Alternating phases let the flash restart if a change lands mid-animation.
      className={`col-sm-9${direction ? ` live-stat--${direction} live-stat--phase-${(seq ?? 0) % 2}` : ''}`}
      data-testid={testId}
      aria-live="polite"
    >
      {total.status === 'loading' ? (
        <span aria-busy="true">…</span>
      ) : total.status === 'error' ? (
        <span title="Couldn't load right now">—</span>
      ) : (
        `${full.format(total.value)}+`
      )}
      {change && (
        <span
          className={`live-stat__change live-stat__change--${direction}`}
          data-testid={`${testId}-change`}
        >
          <Arrow up={direction === 'up'} />
          {change.delta > 0 ? '+' : '−'}
          {full.format(Math.abs(change.delta))}
          <span className="visually-hidden">
            {direction} {full.format(Math.abs(change.delta))}
          </span>
        </span>
      )}
    </dd>
  )
}

export default LiveStat
