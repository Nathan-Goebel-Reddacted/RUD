import "@/App.css";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { applyLanguage } from "@/translations/i18n";
import { Language } from "@/enum/language";

function App() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.getLanguage) {
      applyLanguage(profile.getLanguage());
    } else {
      applyLanguage(Language.EN);
    }
    if (profile) {
      navigate("/dashboard");
    } else {
      navigate("/no-profile");
    }
  }, [profile, navigate]);

  return <p>Redirection en cours...</p>;
}

export default App;