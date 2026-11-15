import { useEffect, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Placeholder from 'react-bootstrap/Placeholder'
import { gameUrl, type GameInfo } from '../roblox/gameInfo.ts'
import { gameStore } from '../roblox/gameStore.ts'

interface GameCardProps {
  /** Roblox place id, i.e. the number in roblox.com/games/<placeId>/... */
  placeId: number
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; info: GameInfo }

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const full = new Intl.NumberFormat('en-US')

function GameCard({ placeId }: GameCardProps) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let haveLive = false

    // Show the build-time snapshot straight away, then replace it with live data.
    gameStore.loadSnapshot(placeId).then((info) => {
      if (!cancelled && !haveLive && info) setState({ status: 'loaded', info })
    })
    gameStore.loadLive(placeId).then(
      (info) => {
        haveLive = true
        if (!cancelled) setState({ status: 'loaded', info })
      },
      () => {
        // Keep showing the snapshot if there is one.
        if (!cancelled) setState((prev) => (prev.status === 'loaded' ? prev : { status: 'error' }))
      },
    )

    return () => {
      cancelled = true
    }
  }, [placeId])

  const href = gameUrl(placeId)

  return (
    <Card className="game-card h-100" data-testid="game-card">
      {state.status === 'loading' && (
        <div data-testid="game-card-loading" aria-busy="true">
          <div className="game-card__image placeholder-glow">
            <Placeholder className="w-100 h-100" />
          </div>
          <Card.Body>
            <Placeholder as={Card.Title} animation="glow">
              <Placeholder xs={8} />
            </Placeholder>
            <Placeholder as={Card.Text} animation="glow">
              <Placeholder xs={5} />
            </Placeholder>
          </Card.Body>
        </div>
      )}

      {state.status === 'error' && (
        <Card.Body>
          <Alert variant="warning" className="mb-3">
            Couldn't load game details right now.
          </Alert>
          <a href={href} target="_blank" rel="noopener noreferrer">
            View on Roblox
          </a>
        </Card.Body>
      )}

      {state.status === 'loaded' && (
        <>
          {state.info.imageUrl && (
            <Card.Img
              variant="top"
              src={state.info.imageUrl}
              alt={`${state.info.name} thumbnail`}
              className="game-card__image"
              loading="lazy"
            />
          )}
          <Card.Body>
            <Card.Title as="h3" className="h5">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="stretched-link text-decoration-none"
              >
                {state.info.name}
              </a>
            </Card.Title>
            <div className="d-flex gap-4 text-secondary">
              <span data-testid="game-playing">
                <strong className="text-body">{full.format(state.info.playing)}</strong> playing
              </span>
              <span
                data-testid="game-visits"
                title={`${full.format(state.info.visits)} visits`}
              >
                <strong className="text-body">{compact.format(state.info.visits)}</strong> visits
              </span>
            </div>
          </Card.Body>
        </>
      )}
    </Card>
  )
}

export default GameCard
