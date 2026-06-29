import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LoginLoadingScreen from "../components/LoginLoadingScreen";

export default function AuthCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      window.location.href = "/";
    } else {
      window.location.href = "/login?error=missing_tokens";
    }
  }, [params]);

  return <LoginLoadingScreen />;
}
