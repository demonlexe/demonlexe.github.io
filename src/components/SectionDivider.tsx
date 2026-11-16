interface SectionDividerProps {
  className?: string
}

function SectionDivider({ className }: SectionDividerProps) {
  return <hr className={className ? `section-divider ${className}` : 'section-divider'} />
}

export default SectionDivider
