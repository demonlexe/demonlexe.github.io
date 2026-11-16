import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LiveStat, { INDICATOR_MS, type Total } from './LiveStat.tsx'

const loaded = (value: number): Total => ({ status: 'loaded', value })

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LiveStat', () => {
  it('shows a loading placeholder', () => {
    render(<LiveStat total={{ status: 'loading' }} testId="stat" />)

    const stat = screen.getByTestId('stat')
    expect(stat.tagName).toBe('DD')
    expect(stat).toHaveTextContent('…')
    expect(stat.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('shows a dash with an explanation when loading failed', () => {
    render(<LiveStat total={{ status: 'error' }} testId="stat" />)

    expect(screen.getByTestId('stat')).toHaveTextContent('—')
    expect(screen.getByTitle("Couldn't load right now")).toBeInTheDocument()
  })

  it('formats a loaded value with separators and a plus', () => {
    render(<LiveStat total={loaded(6120195)} testId="stat" />)

    expect(screen.getByText('6,120,195+')).toBe(screen.getByTestId('stat'))
  })

  it('shows no change indicator for the first value', () => {
    render(<LiveStat total={loaded(100)} testId="stat" />)

    expect(screen.queryByTestId('stat-change')).not.toBeInTheDocument()
  })

  it('shows no change indicator when the value goes from loading to loaded', () => {
    const { rerender } = render(<LiveStat total={{ status: 'loading' }} testId="stat" />)

    rerender(<LiveStat total={loaded(100)} testId="stat" />)

    expect(screen.queryByTestId('stat-change')).not.toBeInTheDocument()
  })

  it('shows no change indicator when a refresh returns the same value', () => {
    const { rerender } = render(<LiveStat total={loaded(100)} testId="stat" />)

    rerender(<LiveStat total={loaded(100)} testId="stat" />)

    expect(screen.queryByTestId('stat-change')).not.toBeInTheDocument()
  })

  it('shows a green up arrow with the increase when the value goes up', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)

    rerender(<LiveStat total={loaded(1012)} testId="stat" />)

    const change = screen.getByTestId('stat-change')
    expect(change).toHaveClass('live-stat__change--up')
    expect(change).toHaveTextContent('+12')
    expect(change.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('1,012+')).toBeInTheDocument()
  })

  it('formats large increases with separators', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)

    rerender(<LiveStat total={loaded(3500)} testId="stat" />)

    expect(screen.getByTestId('stat-change')).toHaveTextContent('+2,500')
  })

  it('announces the change to assistive tech', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)

    rerender(<LiveStat total={loaded(1012)} testId="stat" />)

    expect(screen.getByText('up 12')).toHaveClass('visually-hidden')
    expect(screen.getByTestId('stat')).toHaveAttribute('aria-live', 'polite')
  })

  it('shows a red down arrow when the value goes down', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)

    rerender(<LiveStat total={loaded(997)} testId="stat" />)

    const change = screen.getByTestId('stat-change')
    expect(change).toHaveClass('live-stat__change--down')
    expect(change).toHaveTextContent('−3')
    expect(screen.getByText('down 3')).toBeInTheDocument()
  })

  it('hides the indicator after a few seconds', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)
    rerender(<LiveStat total={loaded(1012)} testId="stat" />)

    act(() => {
      vi.advanceTimersByTime(INDICATOR_MS - 1)
    })
    expect(screen.getByTestId('stat-change')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByTestId('stat-change')).not.toBeInTheDocument()
  })

  it('restarts the indicator when the value changes again', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)
    rerender(<LiveStat total={loaded(1012)} testId="stat" />)
    act(() => {
      vi.advanceTimersByTime(INDICATOR_MS - 1000)
    })

    rerender(<LiveStat total={loaded(1020)} testId="stat" />)
    act(() => {
      vi.advanceTimersByTime(INDICATOR_MS - 1)
    })

    expect(screen.getByTestId('stat-change')).toHaveTextContent('+8')
  })

  it('shows the error state without an indicator if it later reports an error', () => {
    const { rerender } = render(<LiveStat total={loaded(1000)} testId="stat" />)

    rerender(<LiveStat total={{ status: 'error' }} testId="stat" />)

    expect(screen.getByTestId('stat')).toHaveTextContent('—')
    expect(screen.queryByTestId('stat-change')).not.toBeInTheDocument()
  })
})
