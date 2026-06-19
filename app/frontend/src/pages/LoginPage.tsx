import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMicrosoftLogin = () => {
    window.location.href = "/api/auth/authenticate/";
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/dev-login/", { email });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      navigate("/", { replace: true });
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <img src="/logo.png" alt="ISB France" style={{ height: 48, marginBottom: 16 }} />
        <h1>ISBoard</h1>
        <p>Gestion des entretiens annuels et professionnels</p>

        <button onClick={handleMicrosoftLogin} style={{ marginBottom: 20 }}>
          Se connecter avec Microsoft
        </button>

        <hr style={{ border: "none", borderTop: "1px solid #333", margin: "20px 0" }} />

        <form onSubmit={handleDevLogin}>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Mode développement</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "10px 16px",
              fontSize: 14,
              borderRadius: 6,
              border: "none",
              width: 280,
              marginBottom: 8,
            }}
          />
          {error && <p style={{ color: "#e74c3c", fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: 280 }}>
            {loading ? "Connexion..." : "Connexion dev"}
          </button>
        </form>
      </div>
    </div>
  );
}
