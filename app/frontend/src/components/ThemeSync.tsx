import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useColorTheme, getStoredThemeId } from "../contexts/ColorThemeContext";
import api from "../api";
import type { User } from "../types";

export default function ThemeSync() {
  const { setTheme } = useColorTheme();
  const { data: user } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me/").then((r) => r.data),
  });

  useEffect(() => {
    if (!user?.preferences) return;
    // Only apply from API if localStorage is empty (first visit on this device)
    if (getStoredThemeId()) return;
    try {
      const prefs = JSON.parse(user.preferences);
      if (prefs.theme) {
        setTheme(prefs.theme);
      }
    } catch {}
  }, [user, setTheme]);

  return null;
}
