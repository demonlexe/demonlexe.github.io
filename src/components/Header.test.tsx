import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Header from './Header.tsx'

describe('Header', () => {
  it('renders the DemonLexe username, availability lozenge, and 4 right-justified tabs in order', () => {
    render(<Header />)

    const brand = screen.getByText('DemonLexe')
    const lozenge = screen.getByTestId('availability-lozenge')
    const navLinks = screen
      .getAllByRole('link')
      .filter((link) => ['Home', 'Work', 'Stack', 'Contact'].includes(link.textContent ?? ''))

    expect(navLinks.map((link) => link.textContent)).toEqual([
      'Home',
      'Work',
      'Stack',
      'Contact',
    ])

    // DOM order: brand -> lozenge -> tabs
    expect(
      brand.compareDocumentPosition(lozenge) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      lozenge.compareDocumentPosition(navLinks[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    // Right-justified tabs container
    const nav = navLinks[0].closest('.navbar-nav')
    const collapse = nav?.closest('.navbar-collapse')
    expect(nav).toHaveClass('ms-auto')
    expect(collapse).toHaveClass('justify-content-end')
  })

  it('defaults to "For Hire: Open" green lozenge from config', () => {
    render(<Header />)

    const lozenge = screen.getByTestId('availability-lozenge')
    expect(lozenge).toHaveTextContent('For Hire: Open')
    expect(lozenge).toHaveClass('rounded-pill', 'bg-success')
  })

  it('renders orange "For Hire: Busy" lozenge when availability is busy', () => {
    render(<Header availability="busy" />)

    const lozenge = screen.getByTestId('availability-lozenge')
    expect(lozenge).toHaveTextContent('For Hire: Busy')
    expect(lozenge).toHaveClass('rounded-pill', 'availability-lozenge--busy')
  })

  it('renders red "Closed to comms" lozenge when availability is closed', () => {
    render(<Header availability="closed" />)

    const lozenge = screen.getByTestId('availability-lozenge')
    expect(lozenge).toHaveTextContent('Closed to comms')
    expect(lozenge).toHaveClass('rounded-pill', 'bg-danger')
  })

  it('calls onSelectTab when a header tab is clicked', () => {
    const onSelectTab = vi.fn()
    render(<Header activeTab="home" onSelectTab={onSelectTab} />)

    fireEvent.click(screen.getByRole('link', { name: 'Work' }))
    expect(onSelectTab).toHaveBeenCalledWith('work')

    fireEvent.click(screen.getByRole('link', { name: 'Stack' }))
    expect(onSelectTab).toHaveBeenCalledWith('stack')

    fireEvent.click(screen.getByRole('link', { name: 'Contact' }))
    expect(onSelectTab).toHaveBeenCalledWith('contact')
  })
})
