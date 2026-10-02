import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './editorial.css'
import './workflow.css'
import './compatibility.css'
import App from './App.tsx'
import StartupBoundary from './components/StartupBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StartupBoundary><App /></StartupBoundary>
  </StrictMode>,
)
