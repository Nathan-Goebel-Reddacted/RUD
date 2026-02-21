import { useNavigate, useLocation } from "react-router";
import "./NavBar.css";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = ["/", "/no-profile"];
  if (hiddenPaths.includes(location.pathname)) return null;

  const links = [
    { label: "API Config",       path: "/api-config" },
    { label: "Dashboard Editor", path: "/dashboard"  },
    { label: "Display",          path: "/display"    },
  ];

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
      </nav>
    </div>
  );
}

export default NavBar;
