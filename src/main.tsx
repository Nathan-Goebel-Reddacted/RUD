import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes,Route } from "react-router";
import { ProfileProvider } from "@/contexts/ProfileContext";
import '@/index.css'
import App from '@/App.tsx'
import NoProfile from '@/pages/noProfile.tsx'
import Dashboard from '@/pages/dashboard.tsx'


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
