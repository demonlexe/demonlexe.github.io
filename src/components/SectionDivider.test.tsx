import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionDivider from './SectionDivider.tsx'

describe('SectionDivider', () => {
  it('renders a separator with the gradient divider class', () => {
    render(<SectionDivider />)

    expect(screen.getByRole('separator')).toHaveClass('section-divider')
  })
})
