import { useState } from "react";
import Profile from "@/class/Profiles";
import Modal from "@/components/tool/Modal";
import { useProfileStore } from "@/stores/profileStore";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useNavigate } from "react-router";
import { Language, type Language as LanguageType } from "@/enum/language";
import { useTranslation } from "react-i18next";
import { applyColors } from "@/utils/colors";
import { applyLanguage } from "@/translations/i18n";

function ProfileSettings({ onClose, initialProfile, modalId = "ProfileSetting" }: { onClose: () => void; initialProfile?: Profile; modalId?: string }) {
  const [profileName, setProfileName] = useState(initialProfile?.getProfileName() ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roleForEditDashboard, setRoleForEditDashboard] = useState("");
  const [roleForEditProfile, setRoleForEditProfile] = useState("");
  const [language, setLanguage] = useState<LanguageType>(initialProfile?.getLanguage() ?? Language.EN);
  const [backgroundColor, setBackgroundColor] = useState<string>(initialProfile?.getBackgroundColor() ?? "#242424");
  const [borderColor,     setBorderColor]     = useState<string>(initialProfile?.getBorderColor()     ?? "#888888");
  const [textColor,       setTextColor]       = useState<string>(initialProfile?.getTextColor()       ?? "#646cff");
  const [textHoverColor,  setTextHoverColor]  = useState<string>(initialProfile?.getTextHoverColor()  ?? "#535bf2");
  const setProfile = useProfileStore((state) => state.setProfile);
  const clearConnections = useApiStore((state) => state.clearConnections);
  const resetDashboard = useDashboardStore((state) => state.resetDashboard);
  const navigate = useNavigate();
  const { t } = useTranslation();
  


  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile = new Profile();
    newProfile.createAProfile(
      profileName,
      false);
    newProfile.setLanguage(language);
    newProfile.setBackgroundColor(backgroundColor);
    newProfile.setBorderColor(borderColor);
    newProfile.setTextColor(textColor);
    newProfile.setTextHoverColor(textHoverColor);
    const result = newProfile.IsProfileValid();
    if (result.isSuccess()) {
      setErrors({});
      applyColors(newProfile);
      applyLanguage(language);
      if (!initialProfile) {
        clearConnections();
        resetDashboard();
      }
      setProfile(newProfile);
      onClose();
      if (!initialProfile) navigate("/dashboard");
    } else {
      const errs: Record<string, string> = {};
      result.getAllReason().forEach(r => {
        errs[r.getreasonCode()] = r.getreasonMessage();
      });
      setErrors(errs);
    }
  };

  return (
    <Modal id={modalId}>
      <div className="profileSettings">
        <form onSubmit={handleSubmit}>
          <input
            name="Profile Name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder={t("profileSettings.profileName")}
            minLength={5}
            className="display-block margin-10"
            required
          />
          {errors["Profile.name.tooShort"] && (
            <span className="form-error">{t(errors["Profile.name.tooShort"])}</span>
          )}
          <input
            name="Role For Editing Dashboard"
            value={roleForEditDashboard}
            onChange={(e) => setRoleForEditDashboard(e.target.value)}
            placeholder={t("profileSettings.roleForEditDashboard")}
            className="display-block margin-10"
          />
          <input
            name="Role For Editing Profile"
            value={roleForEditProfile}
            onChange={(e) => setRoleForEditProfile(e.target.value)}
            placeholder={t("profileSettings.roleForEditProfile")}
            className="display-block margin-10"
          />
          <select
            name="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageType)}
            className="display-block margin-10"
            required
          >
            <option value={Language.EN}>English</option>
            <option value={Language.FR}>Français</option>
          </select>
          {errors["Profile.invalidLanguage"] && (
            <span className="form-error">{t(errors["Profile.invalidLanguage"])}</span>
          )}
          <div className="d-flex flex-col gap-2 margin-10">
            <label className="d-flex align-center gap-2">
              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
              {t("profileSettings.colors.background")}
            </label>
            <label className="d-flex align-center gap-2">
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
              {t("profileSettings.colors.border")}
            </label>
            <label className="d-flex align-center gap-2">
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
              {t("profileSettings.colors.text")}
            </label>
            <label className="d-flex align-center gap-2">
              <input type="color" value={textHoverColor} onChange={(e) => setTextHoverColor(e.target.value)} />
              {t("profileSettings.colors.textHover")}
            </label>
          </div>
          <button type="submit" className="display-block margin-10">
            {initialProfile ? t("profileSettings.saveProfile") : t("profileSettings.loadProfile")}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default ProfileSettings;