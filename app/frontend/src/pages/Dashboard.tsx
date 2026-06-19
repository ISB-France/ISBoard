import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      await api.post("/auth/logout/", { refresh }).catch(() => {});
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "16px" }}>
        <h1>ISBoard</h1>
        <button onClick={handleLogout}>Déconnexion</button>
      </header>
      <main style={{ padding: "16px" }}>
        <h2>Tableau de bord</h2>
      </main>
    </div>
  );
}
