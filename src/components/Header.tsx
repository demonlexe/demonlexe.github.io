import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import NavbarBrand from 'react-bootstrap/NavbarBrand'

function Header() {
  return (
    <Navbar expand="md" bg="dark" data-bs-theme="dark" className="py-3">
      <Container>
        <NavbarBrand href="/" className="fs-3 fw-semibold">
          DemonLexe
        </NavbarBrand>
      </Container>
    </Navbar>
  )
}

export default Header
