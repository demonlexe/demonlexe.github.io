import { useEffect, useState, type ReactNode } from 'react'
import Badge from 'react-bootstrap/Badge'
import {
  siteConfig,
  type CommunityEntry,
  type ContactDetails,
  type GameEntry,
  type Profile,
} from '../config.ts'
import { yearsSince } from '../experience.ts'
import { gameStore } from '../roblox/gameStore.ts'
import { fetchGroupMemberCount } from '../roblox/groupInfo.ts'
import SectionDivider from './SectionDivider.tsx'
import SectionIcon from './SectionIcon.tsx'

interface AboutMeProps {
  profile?: Profile
  /** Where the bio's Discord link points. */
  contact?: ContactDetails
  /** Games whose visits are added together for "Total visits". */
  games?: readonly GameEntry[]
  /** Communities whose members are added together for "Community members". */
  communities?: readonly CommunityEntry[]
}

type Total = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; value: number }

const full = new Intl.NumberFormat('en-US')

function formatYears(years: number): string {
  return `${years}+ ${years === 1 ? 'year' : 'years'}`
}

/** Fetches one number per id and sums them; any failure fails the whole total. */
function useTotal(ids: readonly number[], fetchOne: (id: number, signal: AbortSignal) => Promise<number>): Total {
  const [total, setTotal] = useState<Total>({ status: 'loading' })
  // Rebuilt from a string key so a fresh `ids` array each render doesn't refetch.
  const key = ids.join(',')

  useEffect(() => {
    const controller = new AbortController()
    const idList = key ? key.split(',').map(Number) : []
    Promise.all(idList.map((id) => fetchOne(id, controller.signal))).then(
      (counts) => setTotal({ status: 'loaded', value: counts.reduce((a, b) => a + b, 0) }),
      () => {
        if (!controller.signal.aborted) setTotal({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [key, fetchOne])

  return total
}

function renderTotal(total: Total): ReactNode {
  if (total.status === 'loading') return <span aria-busy="true">…</span>
  if (total.status === 'error') return <span title="Couldn't load right now">—</span>
  return `${full.format(total.value)}+`
}

// Shares one batched, cached request with the My Games section's game cards.
const visitsOf = async (placeId: number) => (await gameStore.loadLive(placeId)).visits
const membersOf = (groupId: number, signal: AbortSignal) =>
  fetchGroupMemberCount(groupId, fetch, signal)

function AboutMe({
  profile = siteConfig.profile,
  contact = siteConfig.contact,
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

        <dt className="col-sm-3 text-secondary fw-normal">Bio</dt>
        <dd className="col-sm-9">
          {profile.bio}{' '}
          <a
            href={`https://discord.com/users/${encodeURIComponent(contact.discordUserId)}`}
            target="_blank"
            rel="noreferrer"
          >
            Discord ↗
          </a>
        </dd>

        <dt className="col-sm-3 text-secondary fw-normal">Total visits</dt>
        <dd className="col-sm-9" data-testid="total-visits">{renderTotal(visits)}</dd>

        <dt className="col-sm-3 text-secondary fw-normal">Community members</dt>
        <dd className="col-sm-9" data-testid="community-members">{renderTotal(members)}</dd>

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
