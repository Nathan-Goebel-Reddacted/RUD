import { useNavigate, useLocation } from "react-router";
import { useProfileStore } from "@/stores/profileStore";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { openModal, closeModal } from "@/components/tool/Modal";
import ProfileSettings from "@/components/HUD/ProfilSettings";
import { exportBackup } from "@/services/profileBackup";
import "./NavBar.css";

const EDIT_MODAL_ID = "ProfileEdit";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile          = useProfileStore((state) => state.profile);
  const setProfile       = useProfileStore((state) => state.setProfile);
  const connections      = useApiStore((state) => state.connections);
  const currentDashboard = useDashboardStore((state) => state.currentDashboard);

  const hiddenPaths = ["/", "/no-profile"];
  if (hiddenPaths.includes(location.pathname)) return null;

  const links = [
    { label: "API Config",       path: "/api-config" },
    { label: "Dashboard Editor", path: "/dashboard"  },
    { label: "Display",          path: "/display"    },
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
            Edit Profile
          </button>
          <button className="nav-btn" onClick={() => exportBackup(profile, connections, currentDashboard)}>
            Export
          </button>
          <button className="nav-btn nav-btn--danger" onClick={handleDeleteProfile}>
            Delete Profile
          </button>
        </div>
      </nav>
      <ProfileSettings
        modalId={EDIT_MODAL_ID}
        initialProfile={profile ?? undefined}
        onClose={() => closeModal(EDIT_MODAL_ID)}
      />
    </div>
  );
}

export default NavBar;
