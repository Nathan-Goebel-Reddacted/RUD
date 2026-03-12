import { useTranslation } from 'react-i18next'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export default function InstallPromptBanner() {
  const { t } = useTranslation()
  const { showBanner, isIOS, install, dismiss } = useInstallPrompt()

  if (!showBanner) return null

  return (
    <div className="install-banner">
      <span className="install-banner__text">
        {isIOS ? t('installPrompt.iosInstructions') : t('installPrompt.title')}
      </span>
      <div className="install-banner__actions">
        {!isIOS && (
          <button className="install-banner__btn install-banner__btn--primary" onClick={install}>
            {t('installPrompt.install')}
          </button>
        )}
        <button className="install-banner__btn" onClick={dismiss}>
          {t('installPrompt.later')}
        </button>
      </div>
    </div>
  )
}
