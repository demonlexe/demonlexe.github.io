import { useState } from 'react'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import AboutMe from './components/AboutMe.tsx'
import ContactInfo from './components/ContactInfo.tsx'
import GameCard from './components/GameCard.tsx'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import PricingPayment from './components/PricingPayment.tsx'
import { siteConfig, type HeaderTab } from './config.ts'
import { useActiveSection } from './hooks/useActiveSection.ts'

const SECTION_IDS: readonly HeaderTab[] = ['home', 'work', 'stack', 'pricing', 'contact']

function App() {
  const [activeTab, setActiveTab] = useState<HeaderTab>('home')
  useActiveSection(SECTION_IDS, setActiveTab)

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-grow-1">
        <section id="home" aria-labelledby="home-heading" className="py-5">
          <Container>
            <div className="d-flex align-items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}headshot.png`}
                alt="DemonLexe's Roblox avatar headshot"
                width={80}
                height={80}
                className="headshot rounded-circle"
              />
              <div>
                <h1 id="home-heading" className="mb-1">
                  DemonLexe
                </h1>
                <p className="text-secondary mb-0">{siteConfig.tagline}</p>
              </div>
            </div>
            <AboutMe />
          </Container>
        </section>

        <section id="work" aria-labelledby="work-heading" className="py-5">
          <Container>
            <h2 id="work-heading" className="mb-1">
              Work
            </h2>
            <p className="text-secondary mb-0">Roblox games I have worked on.</p>
            <Row xs={1} md={2} lg={3} className="g-4 mt-1">
              {siteConfig.games.map((game) => (
                <Col key={game.placeId}>
                  <GameCard placeId={game.placeId} />
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="stack" aria-labelledby="stack-heading" className="py-5">
          <Container>
            <h2 id="stack-heading" className="mb-1">
              Stack
            </h2>
            <p className="text-secondary mb-0">
              Languages, frameworks, and tools — coming soon.
            </p>
          </Container>
        </section>

        <PricingPayment />

        <section id="contact" aria-labelledby="contact-section-heading" className="py-5">
          <Container>
            <h2 id="contact-section-heading" className="mb-1">
              Contact
            </h2>
            <p className="text-secondary mb-0">Reach out on Discord or Roblox.</p>
            <ContactInfo />
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default App
