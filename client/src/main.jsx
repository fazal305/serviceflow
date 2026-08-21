import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import './index.css'
import { queryClient } from './lib/queryClient'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — set it in client/.env')
}

// Matches the navy/blue design tokens in index.css — keeps Clerk's hosted
// UI (sign-in, sign-up, user menu) visually consistent with the rest of
// the app instead of Clerk's default purple theme.
const clerkAppearance = {
  variables: {
    colorPrimary: '#0369a1',
    colorText: '#020617',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#020617',
    borderRadius: '0.5rem',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={clerkAppearance}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
)
