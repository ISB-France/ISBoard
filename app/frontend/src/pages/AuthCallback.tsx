import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      navigate("/", { replace: true });
    } else {
      navigate("/login?error=missing_tokens", { replace: true });
    }
  }, [params, navigate]);

  return <p>Connexion en cours...</p>;
}
