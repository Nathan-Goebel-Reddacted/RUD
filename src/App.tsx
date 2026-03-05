import "@/App.css";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/stores/profileStore";
import { applyLanguage } from "@/translations/i18n";
import { applyColors } from "@/utils/colors";
import { Language } from "@/enum/language";

function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useProfileStore((state) => state.profile);

  useEffect(() => {
    if (profile?.getLanguage) {
      applyLanguage(profile.getLanguage());
    } else {
      applyLanguage(Language.EN);
    }
    if (profile) {
      applyColors(profile);
      navigate("/dashboard");
    } else {
      navigate("/no-profile");
    }
  }, [profile, navigate]);

  return <p>{t("redirecting")}</p>;
}

export default App;