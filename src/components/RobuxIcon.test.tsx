import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RobuxIcon from './RobuxIcon.tsx'

describe('RobuxIcon', () => {
  it('renders a decorative inline SVG that scales with the text', () => {
    const { container } = render(<RobuxIcon />)

    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '1em')
    expect(svg).toHaveAttribute('height', '1em')
    expect(svg).toHaveAttribute('fill', 'currentColor')
  })
})
