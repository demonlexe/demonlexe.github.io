import { useEffect, useMemo, useState } from 'react'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import type { GameEntry } from '../config.ts'
import { gameStore } from '../roblox/gameStore.ts'
import GameCard from './GameCard.tsx'

interface GameGridProps {
  games: readonly GameEntry[]
}

/**
 * Most visited first. Games with no known count keep their configured order
 * after the ranked ones (Array.sort is stable, so ties do too).
 */
function rankByVisits(
  games: readonly GameEntry[],
  visits: Readonly<Record<number, number>>,
): GameEntry[] {
  return [...games].sort(
    (a, b) => (visits[b.placeId] ?? -1) - (visits[a.placeId] ?? -1),
  )
}

function GameGrid({ games }: GameGridProps) {
  const [visits, setVisits] = useState<Record<number, number>>({})
  // Rebuilt from a string key so a fresh `games` array each render doesn't refetch.
  const key = games.map((g) => g.placeId).join(',')

  useEffect(() => {
    let cancelled = false
    const placeIds = key ? key.split(',').map(Number) : []
    const record = (placeId: number, count: number) => {
      if (!cancelled) setVisits((prev) => ({ ...prev, [placeId]: count }))
    }

    for (const placeId of placeIds) {
      // Rank by the build-time snapshot straight away, then re-rank with live
      // counts. Live results are shared with the cards (one batched request).
      let haveLive = false
      gameStore.loadSnapshot(placeId).then((info) => {
        if (info && !haveLive) record(placeId, info.visits)
      })
      gameStore.loadLive(placeId).then(
        (info) => {
          haveLive = true
          record(placeId, info.visits)
        },
        () => {},
      )
    }

    return () => {
      cancelled = true
    }
  }, [key])

  const ranked = useMemo(() => rankByVisits(games, visits), [games, visits])

  return (
    <Row xs={1} md={2} lg={3} className="g-4 mt-1">
      {ranked.map((game) => (
        <Col key={game.placeId}>
          <GameCard placeId={game.placeId} />
        </Col>
      ))}
    </Row>
  )
}

export default GameGrid
