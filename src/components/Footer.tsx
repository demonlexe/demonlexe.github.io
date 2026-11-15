import Container from 'react-bootstrap/Container'

function Footer() {
  return (
    <footer className="site-footer bg-dark text-light py-3 mt-auto">
      <Container className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="fw-semibold">DemonLexe&apos;s portfolio</span>
        <small className="text-secondary">
          All rights reserved &mdash; not for reuse without permission.{' '}
          <a
            href="https://github.com/demonlexe/demonlexe.github.io/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="link-light text-decoration-underline"
          >
            License
          </a>
        </small>
      </Container>
    </footer>
  )
}

export default Footer
