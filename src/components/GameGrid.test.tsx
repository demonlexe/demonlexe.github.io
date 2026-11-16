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
  it('wraps each card (and its rank badge) in a hover-grow item inside a g-4 grid', () => {
    loadLive.mockReturnValue(new Promise(() => {}))
    const { container } = render(<GameGrid games={[{ placeId: 1 }, { placeId: 2 }]} />)

    // The 1.5rem gutter is what the grow limit in index.css is checked against.
    expect(container.firstElementChild).toHaveClass('g-4')
    for (const card of screen.getAllByTestId('game-card')) {
      expect(card.parentElement).toHaveClass('game-grid__item')
    }
  })

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

  describe('rank badges', () => {
    const games = [{ placeId: 1 }, { placeId: 2 }, { placeId: 3 }, { placeId: 4 }]

    function badgeOf(card: HTMLElement) {
      return card.parentElement?.querySelector('.rank-badge') ?? null
    }

    beforeEach(() => {
      loadLive.mockImplementation(async (id) => info(id, { 1: 500, 2: 9000, 3: 70, 4: 10 }[id]!))
    })

    it('numbers every ranked card from 1 in visit order', async () => {
      render(<GameGrid games={games} />)

      await waitFor(() => expect(titles()).toEqual(['Game 2', 'Game 1', 'Game 3', 'Game 4']))
      const badges = screen
        .getAllByTestId('game-card')
        .map((card) => badgeOf(card)?.textContent)
      expect(badges).toEqual(['1', '2', '3', '4'])
    })

    it('labels each badge for screen readers', async () => {
      render(<GameGrid games={games} />)

      await waitFor(() => expect(titles()[0]).toBe('Game 2'))
      expect(screen.getByLabelText('Rank 1 by visits')).toHaveTextContent('1')
      expect(screen.getByLabelText('Rank 4 by visits')).toHaveTextContent('4')
    })

    it('uses gold, silver and bronze styles for the top three only', async () => {
      render(<GameGrid games={games} />)

      await waitFor(() => expect(titles()[0]).toBe('Game 2'))
      const classes = screen
        .getAllByTestId('game-card')
        .map((card) => badgeOf(card)?.className.split(' ').filter((c) => c.startsWith('rank-badge--')))
      expect(classes).toEqual([['rank-badge--1'], ['rank-badge--2'], ['rank-badge--3'], []])
    })

    it('shows no badge on a game whose visits are unknown', async () => {
      loadLive.mockImplementation(async (id) => {
        if (id === 1) throw new Error('nope')
        return info(id, { 2: 9000, 3: 70, 4: 10 }[id]!)
      })
      render(<GameGrid games={games} />)

      await waitFor(() => expect(titles()).toEqual(['Game 2', 'Game 3', 'Game 4']))
      const cards = screen.getAllByTestId('game-card')
      expect(cards).toHaveLength(4)
      expect(cards.map((card) => badgeOf(card)?.textContent ?? null)).toEqual(['1', '2', '3', null])
    })

    it('shows no badges before any visit count is known', () => {
      loadLive.mockReturnValue(new Promise(() => {}))
      const { container } = render(<GameGrid games={games} />)

      expect(container.querySelectorAll('.rank-badge')).toHaveLength(0)
    })
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
