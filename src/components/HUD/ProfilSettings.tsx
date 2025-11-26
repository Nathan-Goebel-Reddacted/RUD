import { useState } from "react";
import Profile from "@/class/Profiles";
import Modal from "@/components/tool/Modal";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router";
import { Language, type Language as LanguageType } from "@/enum/language";
import { useTranslation } from "react-i18next";

function ProfileSettings({ onClose }: { onClose: () => void }) {
  const [profileName, setProfileName] = useState("");
  const [roleForEditDashboard, setRoleForEditDashboard] = useState("");
  const [roleForEditProfile, setRoleForEditProfile] = useState("");
  const [language, setLanguage] = useState<LanguageType>(Language.EN);
  const { setProfile } = useProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();
  


  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile = new Profile();
    newProfile.createAProfile(
      profileName,
      false);
    if (newProfile.IsProfileValid().isSuccess()){
      setProfile(newProfile);
      console.log("Created Profile:", newProfile);
      onClose();
      navigate("/dashboard");
    }

  };

  return (
    <Modal id="ProfileSetting">
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
          <button type="submit" className="display-block margin-10">Load this Profile</button>
        </form>
      </div>
    </Modal>
  );
}

export default ProfileSettings;