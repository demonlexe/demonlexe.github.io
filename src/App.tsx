import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import AboutMe from './components/AboutMe.tsx'
import ContactInfo from './components/ContactInfo.tsx'
import GameGrid from './components/GameGrid.tsx'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import SectionIcon from './components/SectionIcon.tsx'
import StackList from './components/StackList.tsx'
import OtherWork from './components/OtherWork.tsx'
import PricingPayment from './components/PricingPayment.tsx'
import Testimonials from './components/Testimonials.tsx'
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
                className="headshot headshot--bobbing rounded-circle"
              />
              <div>
                <h1 id="home-heading" className="username-vfx mb-1">
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
            <h2 id="work-heading" className="d-flex align-items-center gap-2 mb-1">
              <SectionIcon name="work" />
              My Games
            </h2>
            <p className="text-secondary mb-0">
              These are games I own and developed from start to finish.
            </p>
            <GameGrid games={siteConfig.games} />
          </Container>
        </section>

        <OtherWork />

        <Testimonials />

        <section id="stack" aria-labelledby="stack-heading" className="py-4">
          <Container>
            <h2 id="stack-heading" className="d-flex align-items-center gap-2 mb-1">
              <SectionIcon name="stack" />
              Technologies used
            </h2>
            <p className="text-secondary mb-0">
              Tools I use to build and ship Roblox games.
            </p>
            <StackList />
          </Container>
        </section>

        <PricingPayment />

        <section id="contact" aria-labelledby="contact-section-heading" className="py-5">
          <Container>
            <h2 id="contact-section-heading" className="d-flex align-items-center gap-2 mb-1">
              <SectionIcon name="contact" />
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
