import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router"
import { useProfileStore } from '@/stores/profileStore'
import { applyLanguage } from '@/translations/i18n'
import { applyColors } from '@/utils/colors'
import { Language } from '@/enum/language'
import NoProfile from '@/pages/noProfile.tsx'
import DisplayDashboard from '@/pages/displayDashboard.tsx'
import "@/translations/i18n"
import '@/assets/Color.css'
import '@/assets/global.css'
import '@/assets/utilities.css'
import '@/assets/dashboard.css'

// eslint-disable-next-line react-refresh/only-export-components
function DisplayRoot() {
  const navigate = useNavigate()
  const profile = useProfileStore((state) => state.profile)

  useEffect(() => {
    if (profile?.getLanguage) {
      applyLanguage(profile.getLanguage())
    } else {
      applyLanguage(Language.EN)
    }
    if (profile) {
      applyColors(profile)
      navigate("/display")
    } else {
      navigate("/no-profile")
    }
  }, [profile, navigate])

  return null
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<DisplayRoot />} />
        <Route path="/no-profile" element={<NoProfile />} />
        <Route path="/display" element={<DisplayDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
