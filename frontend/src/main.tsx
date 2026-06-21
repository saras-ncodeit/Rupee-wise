import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Initialize theme from persistence
const stored = localStorage.getItem('rupeewise-app-storage')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    if (parsed.state?.theme === 'light') {
      document.documentElement.classList.add('light-theme')
    }
  } catch (e) {
    console.error('Failed to restore theme', e)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
