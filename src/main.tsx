import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/components/AuthProvider'
import { MockupsApp } from '@/mockups/MockupsApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)
