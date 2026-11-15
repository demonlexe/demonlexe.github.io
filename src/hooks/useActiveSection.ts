import { useEffect, useRef } from 'react'

// Triggers when a section crosses the band between 35% and 45% from the top of
// the viewport, so the section in the upper-middle of the screen is "active".
const ROOT_MARGIN = '-35% 0px -55% 0px'

/**
 * Watches the elements with the given ids and calls `onActive` with the id of
 * whichever section scrolls into the upper-middle of the viewport.
 * No-ops where IntersectionObserver is unavailable (e.g. jsdom).
 */
export function useActiveSection<T extends string>(
  ids: readonly T[],
  onActive: (id: T) => void,
): void {
  const onActiveRef = useRef(onActive)
  useEffect(() => {
    onActiveRef.current = onActive
  })

  const idsKey = ids.join(',')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const sectionIds = idsKey.split(',') as T[]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as T
          if (entry.isIntersecting && sectionIds.includes(id)) {
            onActiveRef.current(id)
          }
        }
      },
      { rootMargin: ROOT_MARGIN },
    )

    for (const id of sectionIds) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [idsKey])
}
