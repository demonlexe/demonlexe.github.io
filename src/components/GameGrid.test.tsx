import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameGrid from './GameGrid.tsx'
import type { GameInfo } from '../roblox/gameInfo.ts'
import { gameStore } from '../roblox/gameStore.ts'

vi.mock('../roblox/gameStore.ts', () => ({
  gameStore: { loadSnapshot: vi.fn(), loadLive: vi.fn() },
}))

const loadSnapshot = vi.mocked(gameStore.loadSnapshot)
const loadLive = vi.mocked(gameStore.loadLive)

function info(placeId: number, visits: number): GameInfo {
  return {
    placeId,
    universeId: placeId,
    name: `Game ${placeId}`,
    playing: 0,
    visits,
    imageUrl: null,
  }
}

const LIVE_VISITS: Record<number, number> = { 1: 500, 2: 9000, 3: 70 }

function titles() {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
}

beforeEach(() => {
  vi.resetAllMocks()
  loadSnapshot.mockResolvedValue(null)
  loadLive.mockImplementation(async (id) => info(id, LIVE_VISITS[id]))
})

describe('GameGrid', () => {
  it('orders the games from most to fewest visits once loaded', async () => {
    render(<GameGrid games={[{ placeId: 1 }, { placeId: 2 }, { placeId: 3 }]} />)

    await waitFor(() => expect(titles()).toEqual(['Game 2', 'Game 1', 'Game 3']))
  })

  it('keeps the configured order while no visit counts are known yet', () => {
    loadLive.mockReturnValue(new Promise(() => {}))
    render(<GameGrid games={[{ placeId: 1 }, { placeId: 2 }, { placeId: 3 }]} />)

    expect(screen.getAllByTestId('game-card')).toHaveLength(3)
  })

  it('ranks by the build-time snapshot first, then re-ranks with live counts', async () => {
    const snapshot: Record<number, GameInfo> = {
      1: info(1, 10),
      2: info(2, 20),
      3: info(3, 30),
    }
    loadSnapshot.mockImplementation(async (id) => snapshot[id])
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    loadLive.mockImplementation(async (id) => {
      await gate
      return info(id, LIVE_VISITS[id])
    })

    render(<GameGrid games={[{ placeId: 1 }, { placeId: 2 }, { placeId: 3 }]} />)
    await waitFor(() => expect(titles()).toEqual(['Game 3', 'Game 2', 'Game 1']))

    release()
    await waitFor(() => expect(titles()).toEqual(['Game 2', 'Game 1', 'Game 3']))
  })

  it('breaks ties by the configured order', async () => {
    loadLive.mockImplementation(async (id) => info(id, 100))
    render(<GameGrid games={[{ placeId: 3 }, { placeId: 1 }, { placeId: 2 }]} />)

    await waitFor(() => expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3))
    expect(titles()).toEqual(['Game 3', 'Game 1', 'Game 2'])
  })

  it('puts games whose visits could not be loaded after the ranked ones', async () => {
    loadLive.mockImplementation(async (id) => {
      if (id === 1) throw new Error('nope')
      return info(id, LIVE_VISITS[id])
    })
    render(<GameGrid games={[{ placeId: 1 }, { placeId: 2 }, { placeId: 3 }]} />)

    await waitFor(() => expect(titles()).toEqual(['Game 2', 'Game 3']))
    expect(screen.getAllByTestId('game-card')).toHaveLength(3)
    const cards = screen.getAllByTestId('game-card')
    expect(cards[2]).toHaveTextContent(/couldn't load game details/i)
  })
})
