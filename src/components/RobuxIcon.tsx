/** Simple hexagon-with-cutout mark, sized to the surrounding text. */
function RobuxIcon() {
  return (
    <svg
      data-testid="robux-icon"
      aria-hidden="true"
      focusable="false"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M12 1l9.5 5.5v11L12 23l-9.5-5.5v-11L12 1zm0 5.5L7 9.25v5.5L12 17.5l5-2.75v-5.5L12 6.5z"
      />
    </svg>
  )
}

export default RobuxIcon
