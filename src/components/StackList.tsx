import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { siteConfig, type StackGroup } from '../config.ts'

interface StackListProps {
  groups?: readonly StackGroup[]
}

function StackList({ groups = siteConfig.stack }: StackListProps) {
  return (
    <Row xs={1} sm={2} lg={3} xl={4} className="g-2 mt-1">
      {groups.map((group) => (
        <Col key={group.category}>
          <Card className="stack-card h-100">
            <Card.Body className="py-2 px-3">
              <Card.Title as="h3" className="fs-6 text-uppercase mb-1">
                {group.category}
              </Card.Title>
              <ul aria-label={group.category} className="list-unstyled mb-0 d-flex flex-column gap-1">
                {group.tools.map((tool) => (
                  <li key={tool.name}>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="fw-semibold">
                      {tool.name}
                    </a>
                    <span className="ms-1 text-secondary small">{tool.description}</span>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default StackList
