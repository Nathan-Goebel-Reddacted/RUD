import ProfileSettings from "@/components/HUD/ProfilSettings";
import { openModal,closeModal } from  "@/components/tool/Modal"
import { useTranslation } from "react-i18next";

function NoProfile() {
    const { t } = useTranslation();
    return (
        <div className="NoProfilePage">
            <button>{t("noProfile.importProfile")}</button>
            <button onClick={() => openModal("ProfileSetting")}>{t("noProfile.createProfile")}</button>
            <ProfileSettings onClose={() => closeModal("ProfileSetting")}/>
        </div>
    );
}
export default NoProfile;
