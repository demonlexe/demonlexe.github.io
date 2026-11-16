import Badge from 'react-bootstrap/Badge'
import Container from 'react-bootstrap/Container'
import { siteConfig } from '../config.ts'
import RobuxIcon from './RobuxIcon.tsx'
import SectionIcon from './SectionIcon.tsx'

const PAYMENT_ICONS: Record<string, () => React.JSX.Element> = {
  Robux: RobuxIcon,
}

interface PricingPaymentProps {
  methods?: readonly string[]
  hourlyRateUsd?: number
}

function PricingPayment({
  methods = siteConfig.paymentMethods,
  hourlyRateUsd = siteConfig.pricing.hourlyRateUsd,
}: PricingPaymentProps) {
  return (
    <section id="pricing" aria-labelledby="pricing-payment-heading" className="py-5">
      <Container>
        <h2 id="pricing-payment-heading" className="d-flex align-items-center gap-2 mb-1">
          <SectionIcon name="pricing" />
          Pricing &amp; Payment
        </h2>
        <p className="text-secondary">What to expect when working with me.</p>

        <dl className="row g-3 mb-4">
          <div className="col-md-6">
            <dt className="text-secondary fw-normal">Small projects</dt>
            <dd className="mb-1 h4">{`$${hourlyRateUsd}/hr`}</dd>
            <dd className="mb-0">Billed hourly for small, well-scoped tasks.</dd>
          </div>
          <div className="col-md-6">
            <dt className="text-secondary fw-normal">Larger projects</dt>
            <dd className="mb-1 h4">Flexible</dd>
            <dd className="mb-0">
              Rates are negotiable, and I&apos;m open to a percentage (%) payout instead
              of a fixed fee.
            </dd>
          </div>
        </dl>

        <p className="text-secondary mb-2">Accepted payment methods:</p>
        <ul
          aria-label="Accepted payment methods"
          className="list-unstyled d-flex flex-wrap gap-2 mb-0"
        >
          {methods.map((method) => {
            const Icon = PAYMENT_ICONS[method]
            return (
              <Badge
                as="li"
                key={method}
                bg="secondary"
                className="fw-normal fs-6 d-inline-flex align-items-center gap-1"
              >
                {method}
                {Icon && <Icon />}
              </Badge>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}

export default PricingPayment
