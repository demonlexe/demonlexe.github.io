import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import type { HeaderTab } from './config.ts'

const TAB_CONTENT: Record<HeaderTab, { title: string; subtitle: string }> = {
  home: {
    title: 'DemonLexe',
    subtitle: 'Roblox portfolio — coming soon.',
  },
  work: {
    title: 'Work',
    subtitle: 'Selected Roblox games, systems, and projects — coming soon.',
  },
  stack: {
    title: 'Stack',
    subtitle: 'Languages, frameworks, and tools — coming soon.',
  },
  contact: {
    title: 'Contact',
    subtitle: 'Links and inquiries — coming soon.',
  },
}

function App() {
  const [activeTab, setActiveTab] = useState<HeaderTab>('home')
  const section = TAB_CONTENT[activeTab]

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-grow-1">
        <Container className="py-5">
          {activeTab === 'home' && (
            <img
              src={`${import.meta.env.BASE_URL}headshot.png`}
              alt="DemonLexe's Roblox avatar headshot"
              width={160}
              height={160}
              className="headshot rounded-circle mb-4"
            />
          )}
          <h1 className="mb-3">{section.title}</h1>
          <p className="text-secondary mb-0">{section.subtitle}</p>
        </Container>
      </main>

      <Footer />
    </div>
  )
}

export default App
