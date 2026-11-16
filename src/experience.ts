/** Whole calendar years from `startYear` to `now`, never negative. */
export function yearsSince(startYear: number, now: Date = new Date()): number {
  return Math.max(0, now.getFullYear() - startYear)
}
