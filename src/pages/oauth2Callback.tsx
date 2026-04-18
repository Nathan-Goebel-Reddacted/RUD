import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { handleOAuth2Callback } from "@/services/oauth2Pkce";

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const state  = params.get("state");
    const err    = params.get("error");

    if (err) {
      setError(err);
      return;
    }

    if (!code || !state) {
      setError("Missing code or state parameter");
      return;
    }

    handleOAuth2Callback(code, state)
      .then(() => navigate("/api-config", { replace: true }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>OAuth2 error</h2>
        <p style={{ color: "var(--danger-color)", marginTop: "0.5rem" }}>{error}</p>
        <button onClick={() => navigate("/api-config")} style={{ marginTop: "1rem" }}>
          Back to API config
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Completing authorization…</p>
    </div>
  );
}
