import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/stores/profileStore";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { openModal, closeModal } from "@/components/tool/Modal";
import ProfileSettings from "@/components/HUD/ProfilSettings";
import QRCodeModal from "@/components/HUD/QRCodeModal";
import { exportBackup } from "@/services/profileBackup";
import "./NavBar.css";

const EDIT_MODAL_ID = "ProfileEdit";
const QR_MODAL_ID   = "QRCodeShare";

function NavBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [editKey, setEditKey]       = useState(0);
  const [qrOpenCount, setQrOpenCount] = useState(0);
  const profile          = useProfileStore((state) => state.profile);
  const setProfile       = useProfileStore((state) => state.setProfile);
  const connections      = useApiStore((state) => state.connections);
  const dashboards       = useDashboardStore((state) => state.dashboards);

  const hiddenPaths = ["/", "/no-profile"];
  if (hiddenPaths.includes(location.pathname)) return null;
  if (!profile) return null;

  const links = [
    { label: t("navbar.apiConfig"),       path: "/api-config" },
    { label: t("navbar.dashboardEditor"), path: "/dashboard"  },
    { label: t("navbar.display"),         path: "/display"    },
  ];

  const handleDeleteProfile = () => {
    setProfile(null);
    navigate("/no-profile");
  };

  return (
    <div className="nav-wrapper">
      <nav className="nav-bar">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.path}
              className={`nav-btn${isActive ? " nav-btn--active" : ""}`}
              onClick={() => !isActive && navigate(link.path)}
              disabled={isActive}
            >
              {link.label}
            </button>
          );
        })}
        <div className="nav-bar__actions">
          <button className="nav-btn" onClick={() => openModal(EDIT_MODAL_ID)}>
            {t("navbar.editProfile")}
          </button>
          <button className="nav-btn" onClick={() => exportBackup(profile, connections, dashboards)}>
            {t("navbar.export")}
          </button>
          <button className="nav-btn" onClick={() => { setQrOpenCount((c) => c + 1); openModal(QR_MODAL_ID); }}>
            {t("navbar.shareQR")}
          </button>
          <button className="nav-btn nav-btn--danger" onClick={handleDeleteProfile}>
            {t("navbar.deleteProfile")}
          </button>
        </div>
      </nav>
      <ProfileSettings
        key={editKey}
        modalId={EDIT_MODAL_ID}
        initialProfile={profile ?? undefined}
        onClose={() => { closeModal(EDIT_MODAL_ID); setEditKey((k) => k + 1); }}
      />
      <QRCodeModal
        profile={profile}
        connections={connections}
        dashboards={dashboards}
        modalId={QR_MODAL_ID}
        openCount={qrOpenCount}
      />
    </div>
  );
}

export default NavBar;
