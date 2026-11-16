import { useEffect, useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import {
  siteConfig,
  type CommunityEntry,
  type GameEntry,
  type Profile,
} from '../config.ts'
import { yearsSince } from '../experience.ts'
import { gameStore } from '../roblox/gameStore.ts'
import { fetchGroupMemberCount } from '../roblox/groupInfo.ts'
import LiveStat, { type Total } from './LiveStat.tsx'
import SectionDivider from './SectionDivider.tsx'
import SectionIcon from './SectionIcon.tsx'

interface AboutMeProps {
  profile?: Profile
  /** Games whose visits are added together for "Total visits". */
  games?: readonly GameEntry[]
  /** Communities whose members are added together for "Community members". */
  communities?: readonly CommunityEntry[]
}

/** How often the visit and member totals are re-fetched. */
export const REFRESH_MS = 30_000

function formatYears(years: number): string {
  return `${years}+ ${years === 1 ? 'year' : 'years'}`
}

/**
 * Fetches one number per id and sums them, then re-fetches every `REFRESH_MS`.
 * A failure on the first load shows an error until a later refresh succeeds; a
 * failed refresh keeps the last good total. Refreshes pause while the tab is
 * hidden and never overlap.
 */
function useTotal(
  ids: readonly number[],
  fetchOne: (id: number, signal: AbortSignal, fresh: boolean) => Promise<number>,
): Total {
  const [total, setTotal] = useState<Total>({ status: 'loading' })
  // Rebuilt from a string key so a fresh `ids` array each render doesn't refetch.
  const key = ids.join(',')

  useEffect(() => {
    const controller = new AbortController()
    const idList = key ? key.split(',').map(Number) : []
    let busy = false

    const load = (fresh: boolean) => {
      busy = true
      Promise.all(idList.map((id) => fetchOne(id, controller.signal, fresh)))
        .then(
          (counts) => setTotal({ status: 'loaded', value: counts.reduce((a, b) => a + b, 0) }),
          () => {
            if (!controller.signal.aborted) {
              setTotal((prev) => (prev.status === 'loaded' ? prev : { status: 'error' }))
            }
          },
        )
        .finally(() => {
          busy = false
        })
    }

    load(false)
    const timer = setInterval(() => {
      if (!busy && !document.hidden) load(true)
    }, REFRESH_MS)

    return () => {
      clearInterval(timer)
      controller.abort()
    }
  }, [key, fetchOne])

  return total
}

// Shares one batched, cached request with the My Games section's game cards.
// Refreshes skip the cache, otherwise most ticks would just re-read it.
const visitsOf = async (placeId: number, _signal: AbortSignal, fresh: boolean) =>
  (await (fresh ? gameStore.loadLive(placeId, { fresh }) : gameStore.loadLive(placeId))).visits
const membersOf = (groupId: number, signal: AbortSignal) =>
  fetchGroupMemberCount(groupId, fetch, signal)

function AboutMe({
  profile = siteConfig.profile,
  games = siteConfig.games,
  communities = siteConfig.communities,
}: AboutMeProps) {
  const visits = useTotal(games.map((g) => g.placeId), visitsOf)
  const members = useTotal(communities.map((c) => c.groupId), membersOf)

  return (
    <section aria-labelledby="about-me-heading" className="mt-5">
      <SectionDivider />

      <h2 id="about-me-heading" className="h3 d-flex align-items-center gap-2 mb-3 text-uppercase">
        <SectionIcon name="about" />
        About Me
      </h2>

      <dl className="row mb-0">
        <dt className="col-sm-3 text-secondary fw-normal">Experience</dt>
        <dd className="col-sm-9">{formatYears(yearsSince(profile.careerStartYear))}</dd>

        <dt className="col-sm-3 text-secondary fw-normal">Total visits</dt>
        <LiveStat total={visits} testId="total-visits" />

        <dt className="col-sm-3 text-secondary fw-normal">Community members</dt>
        <LiveStat total={members} testId="community-members" />

        <dt className="col-sm-3 text-secondary fw-normal">Skillset</dt>
        <dd className="col-sm-9">
          <ul
            aria-label="Skillset"
            className="list-unstyled d-flex flex-wrap gap-2 mb-0"
          >
            {profile.skills.map((skill) => (
              <Badge
                as="li"
                key={skill.name}
                bg=""
                className={`skill-lozenge skill-lozenge--${skill.kind} fw-normal fs-6`}
              >
                {skill.name}
              </Badge>
            ))}
          </ul>
        </dd>
      </dl>
    </section>
  )
}

export default AboutMe
