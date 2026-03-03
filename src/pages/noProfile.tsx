import { useRef, useState } from "react";
import ProfileSettings from "@/components/HUD/ProfilSettings";
import { openModal, closeModal } from "@/components/tool/Modal";
import { useTranslation } from "react-i18next";
import { importBackup } from "@/services/profileBackup";
import { useProfileStore } from "@/stores/profileStore";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useNavigate } from "react-router";
import { applyColors } from "@/utils/colors";

function NoProfile() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const setProfile       = useProfileStore((s) => s.setProfile);
  const clearConnections = useApiStore((s) => s.clearConnections);
  const addConnection    = useApiStore((s) => s.addConnection);
  const setDashboard     = useDashboardStore((s) => s.setDashboard);
  const navigate         = useNavigate();

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const result = importBackup(json);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      clearConnections();
      for (const conn of result.connections) addConnection(conn);
      setDashboard(result.dashboard);
      applyColors(result.profile);
      setProfile(result.profile);
      navigate("/dashboard");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="NoProfilePage">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />
      <button onClick={() => { setImportError(null); fileInputRef.current?.click(); }}>
        {t("noProfile.importProfile")}
      </button>
      {importError && <span className="form-error">{importError}</span>}
      <button onClick={() => openModal("ProfileSetting")}>{t("noProfile.createProfile")}</button>
      <ProfileSettings onClose={() => closeModal("ProfileSetting")} />
    </div>
  );
}
export default NoProfile;
