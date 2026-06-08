import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/components/AuthProvider'
import { MockupsApp } from '@/mockups/MockupsApp'
import { makeQueryClient } from '@/lib/queries/client'

function Root() {
  // Lazily construct so HMR doesn't recreate the cache mid-session.
  const [queryClient] = useState(() => makeQueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Design mockups — isolated from auth + live data, for fast UI iteration */}
          <Route path="/mockups/*" element={<MockupsApp />} />
          {/* The real app — auth-gated */}
          <Route
            path="/*"
            element={
              <AuthProvider>
                <App />
              </AuthProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
