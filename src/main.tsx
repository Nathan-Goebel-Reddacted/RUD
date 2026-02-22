import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes,Route } from "react-router";
import NavBar from "@/components/HUD/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import App from '@/App.tsx'
import NoProfile from '@/pages/noProfile.tsx'
import Dashboard from '@/pages/dashboard.tsx'
import ApiConfig from '@/pages/apiConfig.tsx'
import DisplayDashboard from '@/pages/displayDashboard.tsx'
import "@/translations/i18n";
import '@/index.css'
import '@/assets/Color.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/no-profile" element={<NoProfile/>}/>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
        <Route path="/api-config" element={<ProtectedRoute><ApiConfig/></ProtectedRoute>}/>
        <Route path="/display" element={<ProtectedRoute><DisplayDashboard/></ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
