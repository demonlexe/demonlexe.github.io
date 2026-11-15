import Badge from 'react-bootstrap/Badge'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavbarBrand from 'react-bootstrap/NavbarBrand'
import NavbarCollapse from 'react-bootstrap/NavbarCollapse'
import NavbarToggle from 'react-bootstrap/NavbarToggle'
import NavLink from 'react-bootstrap/NavLink'
import {
  siteConfig,
  type AvailabilityStatus,
  type HeaderTab,
} from '../config.ts'

interface HeaderProps {
  activeTab?: HeaderTab
  onSelectTab?: (tab: HeaderTab) => void
  availability?: AvailabilityStatus
}

const HEADER_TABS: readonly { key: HeaderTab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'work', label: 'Work' },
  { key: 'stack', label: 'Stack' },
  { key: 'contact', label: 'Contact' },
]

const AVAILABILITY_DISPLAY: Record<
  AvailabilityStatus,
  { label: string; bg: string; className: string }
> = {
  open: {
    label: 'For Hire: Open',
    bg: 'success',
    className: 'availability-lozenge',
  },
  busy: {
    label: 'For Hire: Busy',
    bg: '',
    className: 'availability-lozenge availability-lozenge--busy',
  },
  closed: {
    label: 'Closed to comms',
    bg: 'danger',
    className: 'availability-lozenge',
  },
}

function isHeaderTab(value: string | null): value is HeaderTab {
  return HEADER_TABS.some((tab) => tab.key === value)
}

function Header({
  activeTab = 'home',
  onSelectTab,
  availability = siteConfig.availability,
}: HeaderProps) {
  const status = AVAILABILITY_DISPLAY[availability]

  return (
    <Navbar
      expand="md"
      collapseOnSelect
      bg="dark"
      data-bs-theme="dark"
      className="py-3"
    >
      <Container>
        <div className="d-flex align-items-center gap-3">
          <NavbarBrand
            href="#home"
            className="fs-3 fw-semibold me-0"
            onClick={() => onSelectTab?.('home')}
          >
            DemonLexe
          </NavbarBrand>
          <Badge
            pill
            bg={status.bg}
            className={status.className}
            data-testid="availability-lozenge"
          >
            {status.label}
          </Badge>
        </div>

        <NavbarToggle aria-controls="main-navbar-nav" />

        <NavbarCollapse id="main-navbar-nav" className="justify-content-end">
          <Nav
            className="ms-auto"
            activeKey={activeTab}
            onSelect={(eventKey) => {
              if (isHeaderTab(eventKey)) {
                onSelectTab?.(eventKey)
              }
            }}
          >
            {HEADER_TABS.map((tab) => (
              <NavLink key={tab.key} eventKey={tab.key} href={`#${tab.key}`}>
                {tab.label}
              </NavLink>
            ))}
          </Nav>
        </NavbarCollapse>
      </Container>
    </Navbar>
  )
}

export default Header
