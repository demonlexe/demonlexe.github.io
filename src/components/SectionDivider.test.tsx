import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionDivider from './SectionDivider.tsx'

describe('SectionDivider', () => {
  it('renders a separator with the gradient divider class', () => {
    render(<SectionDivider />)

    expect(screen.getByRole('separator')).toHaveClass('section-divider')
  })

  it('accepts extra classes for spacing', () => {
    render(<SectionDivider className="mt-3" />)

    expect(screen.getByRole('separator')).toHaveClass('section-divider', 'mt-3')
  })
})
