const API_URL = import.meta.env.VITE_API_URL || "";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/authenticate/`;
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <h1>ISBoard</h1>
        <p>Gestion des entretiens annuels et professionnels</p>
        <button onClick={handleLogin} style={{ padding: "12px 24px", fontSize: "16px", cursor: "pointer" }}>
          Se connecter avec Microsoft
        </button>
      </div>
    </div>
  );
}
