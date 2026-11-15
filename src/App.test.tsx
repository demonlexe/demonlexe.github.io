import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('renders the header with DemonLexe, default lozenge, and 4 tabs', () => {
    render(<App />)

    expect(screen.getByTestId('availability-lozenge')).toHaveTextContent('For Hire: Open')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DemonLexe')
  })

  it('switches active tab and main content when clicking header tabs', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'Work' }))
    expect(screen.getByRole('link', { name: 'Work' })).toHaveClass('active')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Work')

    fireEvent.click(screen.getByRole('link', { name: 'Stack' }))
    expect(screen.getByRole('link', { name: 'Stack' })).toHaveClass('active')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Stack')

    fireEvent.click(screen.getByRole('link', { name: 'Contact' }))
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveClass('active')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Contact')

    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DemonLexe')
  })
})
