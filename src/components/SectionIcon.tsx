export type SectionIconName =
  | 'about'
  | 'work'
  | 'testimonials'
  | 'stack'
  | 'pricing'
  | 'contact'

interface SectionIconProps {
  name: SectionIconName
}

/** Decorative gradient icon shown to the left of a section title (see index.css). */
function SectionIcon({ name }: SectionIconProps) {
  return <span aria-hidden="true" className={`section-icon section-icon--${name}`} />
}

export default SectionIcon
