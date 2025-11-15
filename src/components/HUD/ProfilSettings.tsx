import { useState } from "react";
import Profile from "@/class/Profiles";
import Modal from "@/components/tool/Modal";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router";

function ProfileSettings({ onClose }: { onClose: () => void }) {
  const [profileName, setProfileName] = useState("");
  const [roleForEditDashboard, setRoleForEditDashboard] = useState("");
  const [roleForEditProfile, setRoleForEditProfile] = useState("");
  const [language, setLanguage] = useState("English");
  const { setProfile } = useProfile();
  const navigate = useNavigate();


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
            placeholder="Profile Name"
            minLength={5}
            className="display-block margin-10"
            required
          />
          <input
            name="Role For Editing Dashboard"
            value={roleForEditDashboard}
            onChange={(e) => setRoleForEditDashboard(e.target.value)}
            placeholder="Role For Editing Dashboard"
            className="display-block margin-10"
          />
          <input
            name="Role For Editing Profile"
            value={roleForEditProfile}
            onChange={(e) => setRoleForEditProfile(e.target.value)}
            placeholder="Role For Editing Profile"
            className="display-block margin-10"
          />
          <select
            name="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="display-block margin-10"
            required
          >
            <option value="English">English</option>
            <option value="French">Français</option>
          </select>
          <button type="submit" className="display-block margin-10">Load this Profile</button>
        </form>
      </div>
    </Modal>
  );
}

export default ProfileSettings;