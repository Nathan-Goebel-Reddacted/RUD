import { useProfile } from "@/contexts/ProfileContext";


function Dashboard() {
    const { profile } = useProfile();
    return (
        <div>
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