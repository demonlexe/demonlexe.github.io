# DemonLexe — Roblox Portfolio

Personal portfolio site for **DemonLexe**, built with React, TypeScript, Vite,
React Bootstrap, and Bootstrap 5.

## Stack

| Package        | Version  |
| -------------- | -------- |
| react          | 19.x     |
| react-dom      | 19.x     |
| typescript     | 5.x      |
| vite           | 8.x      |
| react-bootstrap| 2.x      |
| bootstrap      | 5.3.x    |

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build to dist/
npm run preview  # preview the production build
npm run lint     # run oxlint
npm test         # run vitest unit/component tests
```

## Project structure

```
src/
  components/
    Header.tsx    # top navigation bar (brand, availability lozenge, nav tabs)
    Footer.tsx    # site footer (name + license notice)
  config.ts       # site configuration (availability, robloxUserId)
  App.tsx         # page shell: Header / main / Footer
  index.css       # global styles (imported after Bootstrap)
  main.tsx        # entry point; imports Bootstrap CSS first

build/
  robloxHeadshot.ts  # Vite plugin: fetches the avatar headshot for config.robloxUserId
```

## Roblox headshot

The home page shows the Roblox avatar headshot for `siteConfig.robloxUserId`
(`src/config.ts`). Roblox's thumbnails API sends no CORS headers, so the image is
fetched by a Vite plugin at dev-server/build time and served as `/headshot.png`
rather than from the browser. Building therefore requires network access.

## Bootstrap

Bootstrap's stylesheet is imported first in `src/main.tsx` so that project
styles take precedence over framework defaults:

```ts
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
```

React Bootstrap components are imported individually, e.g.
`import Container from 'react-bootstrap/Container'`. Only the CSS is bundled —
no Bootstrap JavaScript bundle is included, so interactive components must come
from React Bootstrap rather than raw Bootstrap JS.

## License

This project is **not** open source and is **not** licensed under any open
source license. All rights reserved by DemonLexe — see [LICENSE](./LICENSE) for
the full terms.
