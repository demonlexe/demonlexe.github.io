import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Testimonials from './Testimonials.tsx'

describe('Testimonials', () => {
  it('is its own section with a level-2 Testimonials heading', () => {
    const { container } = render(<Testimonials />)

    const heading = screen.getByRole('heading', { level: 2, name: 'Testimonials' })
    const section = container.querySelector('section#testimonials')
    expect(section).not.toBeNull()
    expect(section).toHaveAttribute('aria-labelledby', heading.id)
    expect(heading.id).not.toBe('')
  })

  it('links to the DevForum thread the comments came from', () => {
    render(<Testimonials />)

    expect(screen.getByRole('link', { name: /devforum/i })).toHaveAttribute(
      'href',
      'https://devforum.roblox.com/t/open-demonlexes-portfolio-scriptingui/577664',
    )
  })

  it('shows one card per DevForum testimonial, credited by username only', () => {
    render(<Testimonials />)

    const cards = screen.getAllByTestId('testimonial-card')
    expect(cards).toHaveLength(3)

    expect(cards.map((card) => within(card).getByTestId('testimonial-author').textContent)).toEqual([
      'moslugs',
      'TelMemes',
      'SamIsAcidic',
    ])
    expect(within(cards[0]).getByText(/dedicated programmers I know/i)).toBeInTheDocument()
    expect(within(cards[1]).getByText(/Extremely skilled and affordable/i)).toBeInTheDocument()
    expect(within(cards[2]).getByText(/Massive vouch from me/i)).toBeInTheDocument()
  })

  it('renders each comment as a blockquote attributed through a figcaption', () => {
    render(<Testimonials />)

    for (const card of screen.getAllByTestId('testimonial-card')) {
      expect(card.querySelector('blockquote')).not.toBeNull()
      expect(card.querySelector('figcaption')).not.toBeNull()
    }
  })

  it('does not show dates or display names', () => {
    const { container } = render(<Testimonials />)

    expect(container.textContent).not.toMatch(/2020/)
    expect(container.textContent).not.toMatch(/\b(May|Jul)\b/)
    expect(container.textContent).not.toMatch(/\bmelly\b/i)
    expect(container.textContent).not.toMatch(/\bkyle\b/i)
  })

  it('keeps the full text of a multi-paragraph comment, including the star rating', () => {
    render(<Testimonials />)

    const card = screen.getAllByTestId('testimonial-card')[2]
    expect(within(card).getByText(/custom backpack\/toolbar UI/i)).toBeInTheDocument()
    expect(within(card).getByLabelText('5 out of 5 stars')).toHaveTextContent('⭐⭐⭐⭐⭐')
  })

  it('staggers the cards: left, right, left', () => {
    render(<Testimonials />)

    const cards = screen.getAllByTestId('testimonial-card')
    expect(cards.map((card) => card.getAttribute('data-align'))).toEqual(['left', 'right', 'left'])

    const items = cards.map((card) => card.closest('li') as HTMLElement)
    expect(items[0]).not.toHaveClass('ms-md-auto')
    expect(items[1]).toHaveClass('ms-md-auto')
    expect(items[2]).not.toHaveClass('ms-md-auto')
    for (const item of items) {
      expect(item).toHaveClass('col-md-10')
      expect(item).not.toHaveClass('col-md-8')
    }
  })

  it('renders custom testimonials and alternates alignment', () => {
    render(
      <Testimonials
        testimonials={[
          { author: 'a', quote: ['one'] },
          { author: 'b', quote: ['two'] },
        ]}
      />,
    )

    const cards = screen.getAllByTestId('testimonial-card')
    expect(cards).toHaveLength(2)
    expect(cards.map((c) => c.getAttribute('data-align'))).toEqual(['left', 'right'])
  })
})
