import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionIcon from './SectionIcon.tsx'

describe('SectionIcon', () => {
  it('is a decorative element hidden from assistive tech', () => {
    const { container } = render(<SectionIcon name="work" />)

    const icon = container.firstElementChild as HTMLElement
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveTextContent('')
  })

  it('picks its icon from the section name', () => {
    const { container } = render(<SectionIcon name="stack" />)

    expect(container.firstElementChild).toHaveClass('section-icon', 'section-icon--stack')
  })
})
