import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import { siteConfig, type Testimonial } from '../config.ts'
import SectionIcon from './SectionIcon.tsx'

interface TestimonialsProps {
  testimonials?: readonly Testimonial[]
  sourceUrl?: string
}

function Testimonials({
  testimonials = siteConfig.testimonials,
  sourceUrl = siteConfig.testimonialsSourceUrl,
}: TestimonialsProps) {
  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="py-5">
      <Container>
        <h2 id="testimonials-heading" className="d-flex align-items-center gap-2 mb-1">
          <SectionIcon name="testimonials" />
          Testimonials
        </h2>
        <p className="text-secondary">
          What clients said on the{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            Roblox DevForum
          </a>
          .
        </p>

        <ul className="list-unstyled row g-4 mb-0">
          {testimonials.map((testimonial, index) => {
            const align = index % 2 === 0 ? 'left' : 'right'
            return (
              <li
                key={testimonial.author}
                className={`col-md-10${align === 'right' ? ' ms-md-auto' : ''}`}
              >
                <Card
                  as="figure"
                  className={`testimonial-card testimonial-card--${align} mb-0 h-100`}
                  data-testid="testimonial-card"
                  data-align={align}
                >
                  <Card.Body>
                    <blockquote className="mb-3">
                      {testimonial.quote.map((paragraph, i) => (
                        <p key={i} className="mb-2">
                          {paragraph}
                        </p>
                      ))}
                      {testimonial.rating !== undefined && (
                        <p
                          className="mb-0"
                          role="img"
                          aria-label={`${testimonial.rating} out of 5 stars`}
                        >
                          {'⭐'.repeat(testimonial.rating)}
                        </p>
                      )}
                    </blockquote>
                    <figcaption className="text-secondary mb-0">
                      — <span data-testid="testimonial-author">{testimonial.author}</span>
                    </figcaption>
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}

export default Testimonials
