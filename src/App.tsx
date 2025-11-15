import "@/App.css";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";

function App() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile) {
      navigate("/dashboard");
    } else {
      navigate("/no-profile");
    }
  }, [profile, navigate]);

  return <p>Redirection en cours...</p>;
}

export default App;