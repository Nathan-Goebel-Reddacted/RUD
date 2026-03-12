import { useEffect, useRef, useState } from "react";
import ProfileSettings from "@/components/HUD/ProfilSettings";
import { openModal, closeModal } from "@/components/tool/Modal";
import { useTranslation } from "react-i18next";
import { importBackup } from "@/services/profileBackup";
import { decodeProfileFromQR } from "@/services/profileQR";
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
  const setDashboards    = useDashboardStore((s) => s.setDashboards);
  const navigate         = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#import?data=")) return;
    const encoded = new URLSearchParams(hash.slice("#import?".length)).get("data");
    if (!encoded) return;
    const result = decodeProfileFromQR(encoded);
    if (!result.ok) {
      setImportError(result.error);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    clearConnections();
    for (const conn of result.connections) addConnection(conn);
    setDashboards(result.dashboards);
    applyColors(result.profile);
    setProfile(result.profile);
    navigate("/display");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: mount-only hash import

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
      setDashboards(result.dashboards);
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
