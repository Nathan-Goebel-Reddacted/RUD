import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'rud-install-dismissed'
const DISMISSED_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function isStandalone(): boolean {
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true
  return false
}

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  if (isNaN(ts)) return false
  return Date.now() - ts < DISMISSED_TTL_MS
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner]         = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (ios) {
      setIsIOS(true)
      setShowBanner(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setShowBanner(false)
  }

  return { showBanner, isIOS, install, dismiss }
}
