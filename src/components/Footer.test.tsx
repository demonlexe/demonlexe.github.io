import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Footer from './Footer.tsx'

describe('Footer', () => {
  it('uses the gradient footer class', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).toHaveClass('site-footer')
  })

  it('does not use Bootstrap bg-dark, which would override the solid purple', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).not.toHaveClass('bg-dark')
  })

  it('keeps the copyright text readable on purple (not the grey text-secondary)', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer small')).not.toHaveClass('text-secondary')
  })

  it("says \"DemonLexe's portfolio\"", () => {
    render(<Footer />)
    expect(screen.getByText("DemonLexe's portfolio")).toBeInTheDocument()
  })
})
