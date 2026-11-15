import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Footer from './Footer.tsx'

describe('Footer', () => {
  it('uses the gradient footer class', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).toHaveClass('site-footer')
  })

  it("says \"DemonLexe's portfolio\"", () => {
    render(<Footer />)
    expect(screen.getByText("DemonLexe's portfolio")).toBeInTheDocument()
  })
})
