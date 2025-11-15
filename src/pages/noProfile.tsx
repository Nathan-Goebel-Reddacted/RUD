import ProfileSettings from "@/components/HUD/ProfilSettings";
import { openModal,closeModal } from  "@/components/tool/Modal"

function NoProfile() {
    return (
        <div className="NoProfilePage">
            <button>importer un profile</button>
            <button onClick={() => openModal("ProfileSetting")}>Créer un profile</button>
            <ProfileSettings onClose={() => closeModal("ProfileSetting")}/>
        </div>
    );
}
export default NoProfile;
