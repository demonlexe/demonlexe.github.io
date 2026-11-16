import { useEffect, useState } from 'react'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import { siteConfig, type OtherWorkClient, type OtherWorkEntry } from '../config.ts'
import { fetchGroupIconUrl, fetchGroupMemberCount } from '../roblox/groupInfo.ts'

interface OtherWorkProps {
  entries?: readonly OtherWorkEntry[]
}

type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; value: T }

const full = new Intl.NumberFormat('en-US')

function useLoadable<T>(
  load: (signal: AbortSignal) => Promise<T>,
  key: number,
): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(
      (value) => setState({ status: 'loaded', value }),
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
    // `load` is rebuilt every render; the group id is what identifies the request.
  }, [key])

  return state
}

function ClientBadge({ client }: { client: OtherWorkClient }) {
  const members = useLoadable((signal) => fetchGroupMemberCount(client.groupId, fetch, signal), client.groupId)
  const icon = useLoadable((signal) => fetchGroupIconUrl(client.groupId, fetch, signal), client.groupId)

  return (
    <div className="d-flex align-items-center gap-3 mb-3" data-testid="other-work-client">
      {icon.status === 'loaded' && icon.value && (
        <img
          src={icon.value}
          alt={`${client.name} icon`}
          width={48}
          height={48}
          className="rounded"
          loading="lazy"
        />
      )}
      <div>
        <div className="text-secondary small">Completed on behalf of</div>
        <a href={client.url} target="_blank" rel="noopener noreferrer" className="fw-semibold">
          {client.name}
        </a>
        <div className="text-secondary small">
          {members.status === 'loading' && <span aria-busy="true">…</span>}
          {members.status === 'error' && <span title="Couldn't load right now">—</span>}
          {members.status === 'loaded' && (
            <>
              <strong className="text-body">{full.format(members.value)}</strong> members
            </>
          )}
          {members.status === 'error' && ' members'}
        </div>
      </div>
    </div>
  )
}

function OtherWork({ entries = siteConfig.otherWork }: OtherWorkProps) {
  return (
    <section id="other-work" aria-labelledby="other-work-heading" className="py-5">
      <Container>
        <h2 id="other-work-heading" className="mb-1">
          Other Work
        </h2>
        <p className="text-secondary">UI and systems I built for clients, beyond my own games.</p>

        {entries.map((entry) => (
          <article key={entry.title} className="mt-4">
            <h3 className="h4 mb-1">{entry.title}</h3>
            <p className="text-secondary">{entry.note}</p>
            <ClientBadge client={entry.client} />
            <div className="row g-4">
              {entry.videos.map((video) => (
                <figure
                  key={video.file}
                  className="col-md-6 mb-0"
                  data-testid="other-work-video"
                >
                  <Card className="h-100">
                    <video
                      className="w-100 other-work__video"
                      src={`${import.meta.env.BASE_URL}${video.file}`}
                      controls
                      preload="metadata"
                      playsInline
                      aria-label={`${entry.title}: ${video.label}`}
                    />
                    <Card.Body>
                      <figcaption className="mb-0">{video.label}</figcaption>
                    </Card.Body>
                  </Card>
                </figure>
              ))}
            </div>
          </article>
        ))}
      </Container>
    </section>
  )
}

export default OtherWork
