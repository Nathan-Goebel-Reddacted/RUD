import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes,Route } from "react-router";
import { ProfileProvider } from "@/contexts/ProfileContext";
import App from '@/App.tsx'
import NoProfile from '@/pages/noProfile.tsx'
import Dashboard from '@/pages/dashboard.tsx'
import "@/translations/i18n";
import '@/index.css'
import '@/assets/Color.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/no-profile" element={<NoProfile/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  </StrictMode>,
)
