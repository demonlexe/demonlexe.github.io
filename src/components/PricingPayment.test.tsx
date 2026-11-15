import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PricingPayment from './PricingPayment.tsx'

describe('PricingPayment', () => {
  it('is its own section with a level-2 Pricing & Payment heading', () => {
    const { container } = render(<PricingPayment />)

    const heading = screen.getByRole('heading', { level: 2, name: /pricing & payment/i })
    const section = container.querySelector('section#pricing')
    expect(section).not.toBeNull()
    expect(section).toHaveAttribute('aria-labelledby', heading.id)
  })

  it('shows the $30/hr hourly rate for small projects', () => {
    render(<PricingPayment />)

    expect(screen.getByText('Small projects')).toBeInTheDocument()
    expect(screen.getByText('$30/hr')).toBeInTheDocument()
    expect(screen.getByText(/hourly/i)).toBeInTheDocument()
  })

  it('uses a custom hourly rate when given', () => {
    render(<PricingPayment hourlyRateUsd={45} />)

    expect(screen.getByText('$45/hr')).toBeInTheDocument()
    expect(screen.queryByText('$30/hr')).not.toBeInTheDocument()
  })

  it('says larger projects are flexible and can be paid as a percentage payout', () => {
    render(<PricingPayment />)

    expect(screen.getByText('Larger projects')).toBeInTheDocument()
    expect(screen.getByText('Flexible')).toBeInTheDocument()
    expect(screen.getByText(/percentage/i)).toBeInTheDocument()
  })

  it('lists Robux and PayPal (USD) as accepted payment methods', () => {
    render(<PricingPayment />)

    const methods = within(screen.getByRole('list', { name: /accepted payment/i })).getAllByRole(
      'listitem',
    )
    expect(methods.map((item) => item.textContent)).toEqual(['Robux', 'PayPal (USD)'])
  })

  it('shows a Robux icon after the Robux text, and none on PayPal', () => {
    render(<PricingPayment />)

    const [robux, paypal] = within(
      screen.getByRole('list', { name: /accepted payment/i }),
    ).getAllByRole('listitem')

    const icon = within(robux).getByTestId('robux-icon')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(robux.firstChild?.textContent).toBe('Robux')
    expect(robux.lastChild).toBe(icon)
    expect(within(paypal).queryByTestId('robux-icon')).not.toBeInTheDocument()
  })

  it('accepts custom payment methods', () => {
    render(<PricingPayment methods={['Gold']} />)

    expect(screen.getByRole('listitem')).toHaveTextContent('Gold')
  })
})
