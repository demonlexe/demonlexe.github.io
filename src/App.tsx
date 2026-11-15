import Container from 'react-bootstrap/Container'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-grow-1">
        <Container className="py-5">
          <h1 className="mb-3">DemonLexe</h1>
          <p className="text-secondary mb-0">
            Roblox portfolio &mdash; coming soon.
          </p>
        </Container>
      </main>

      <Footer />
    </div>
  )
}

export default App
