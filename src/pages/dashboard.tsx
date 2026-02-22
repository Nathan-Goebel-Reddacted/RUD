import { useProfileStore } from "@/stores/profileStore";

function Dashboard() {
    const profile = useProfileStore((state) => state.profile);
    return (
        <div className="page-with-nav">
        <h1>Dashboard Page</h1>
         {profile ? (
                <p>Active profile: {profile.getProfileName()}</p>
            ) : (
                <p>No profile loaded</p>
            )}
        </div>
    );
}

export default Dashboard;