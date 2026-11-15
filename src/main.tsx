import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bootstrap CSS is imported first so that styles from components
// (and src/index.css) take precedence over the framework defaults.
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
