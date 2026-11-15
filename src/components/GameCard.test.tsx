import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameCard from './GameCard.tsx'
import type { GameInfo } from '../roblox/gameInfo.ts'
import { gameStore } from '../roblox/gameStore.ts'

vi.mock('../roblox/gameStore.ts', () => ({
  gameStore: { loadSnapshot: vi.fn(), loadLive: vi.fn() },
}))

const PLACE_ID = 85115018573521

function info(overrides: Partial<GameInfo> = {}): GameInfo {
  return {
    placeId: PLACE_ID,
    universeId: 1,
    name: 'Pick a Gear Tower 💥',
    playing: 1234,
    visits: 6106400,
    imageUrl: 'https://tr.rbxcdn.com/thumb.png',
    ...overrides,
  }
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const loadSnapshot = vi.mocked(gameStore.loadSnapshot)
const loadLive = vi.mocked(gameStore.loadLive)

beforeEach(() => {
  vi.resetAllMocks()
  loadSnapshot.mockResolvedValue(null)
})

describe('GameCard', () => {
  it('shows a loading state, then the fetched game details', async () => {
    const live = deferred<GameInfo>()
    loadLive.mockReturnValue(live.promise)

    render(<GameCard placeId={PLACE_ID} />)
    expect(screen.getByTestId('game-card-loading')).toBeInTheDocument()
    expect(loadLive).toHaveBeenCalledWith(PLACE_ID)

    live.resolve(info())

    expect(
      await screen.findByRole('heading', { name: 'Pick a Gear Tower 💥' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('game-card-loading')).not.toBeInTheDocument()

    expect(screen.getByTestId('game-playing')).toHaveTextContent('1,234')
    expect(screen.getByTestId('game-playing')).toHaveTextContent(/playing/i)
    expect(screen.getByTestId('game-visits')).toHaveTextContent('6.1M')
    expect(screen.getByTestId('game-visits')).toHaveTextContent(/visits/i)
    expect(screen.getByTestId('game-visits')).toHaveAttribute('title', '6,106,400 visits')
    expect(screen.getByRole('img', { name: /Pick a Gear Tower/ })).toHaveAttribute(
      'src',
      'https://tr.rbxcdn.com/thumb.png',
    )
  })

  it('shows the build-time snapshot immediately, then swaps in live numbers', async () => {
    const live = deferred<GameInfo>()
    loadSnapshot.mockResolvedValue(info({ playing: 5 }))
    loadLive.mockReturnValue(live.promise)

    render(<GameCard placeId={PLACE_ID} />)

    expect(await screen.findByTestId('game-playing')).toHaveTextContent('5')
    expect(screen.queryByTestId('game-card-loading')).not.toBeInTheDocument()

    live.resolve(info({ playing: 77 }))

    expect(await screen.findByText('77')).toBeInTheDocument()
    expect(screen.getByTestId('game-playing')).toHaveTextContent('77')
  })

  it('does not let a late snapshot overwrite live data', async () => {
    const snapshot = deferred<GameInfo | null>()
    loadSnapshot.mockReturnValue(snapshot.promise)
    loadLive.mockResolvedValue(info({ playing: 77 }))

    render(<GameCard placeId={PLACE_ID} />)
    expect(await screen.findByText('77')).toBeInTheDocument()

    snapshot.resolve(info({ playing: 5 }))
    await Promise.resolve()
    await Promise.resolve()

    expect(screen.getByTestId('game-playing')).toHaveTextContent('77')
  })

  it('keeps showing the snapshot if the live fetch fails', async () => {
    loadSnapshot.mockResolvedValue(info({ playing: 5 }))
    loadLive.mockRejectedValue(new Error('429'))

    render(<GameCard placeId={PLACE_ID} />)

    expect(await screen.findByTestId('game-playing')).toHaveTextContent('5')
    await Promise.resolve()
    await Promise.resolve()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('game-playing')).toHaveTextContent('5')
  })

  it('links to the game on roblox.com', async () => {
    loadLive.mockResolvedValue(info({ name: 'Pick a Gear Tower', imageUrl: null }))

    render(<GameCard placeId={PLACE_ID} />)

    const link = await screen.findByRole('link', { name: /Pick a Gear Tower/ })
    expect(link).toHaveAttribute('href', `https://www.roblox.com/games/${PLACE_ID}`)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('omits the image when none is available', async () => {
    loadLive.mockResolvedValue(info({ name: 'No Pic', imageUrl: null }))

    render(<GameCard placeId={PLACE_ID} />)

    await screen.findByRole('heading', { name: 'No Pic' })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows an error with a link to the game when there is no snapshot and the fetch fails', async () => {
    loadLive.mockRejectedValue(new Error('boom'))

    render(<GameCard placeId={PLACE_ID} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t load/i)
    expect(screen.getByRole('link', { name: /view on roblox/i })).toHaveAttribute(
      'href',
      `https://www.roblox.com/games/${PLACE_ID}`,
    )
  })
})
