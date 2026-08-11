import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './hooks/useTheme'
import { ToastProvider } from './hooks/useToast'
import { ensureSeedMetadata } from './db/database'

async function bootstrap() {
  await ensureSeedMetadata()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

bootstrap()
