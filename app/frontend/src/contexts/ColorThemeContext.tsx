import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ColorTheme {
  id: string;
  label: string;
  icon: string;
  hue: number;
  dark: boolean;
}

export const THEMES: ColorTheme[] = [
  { id: "isb", label: "ISB", icon: "🟤", hue: 36, dark: false },
  { id: "blue", label: "Bleu", icon: "🔵", hue: 220, dark: false },
  { id: "green", label: "Vert", icon: "🟢", hue: 142, dark: false },
  { id: "purple", label: "Violet", icon: "🟣", hue: 270, dark: false },
  { id: "red", label: "Rouge", icon: "🔴", hue: 0, dark: false },
  { id: "teal", label: "Teal", icon: "🩵", hue: 180, dark: false },
  { id: "pink", label: "Rose", icon: "🩷", hue: 330, dark: false },
  { id: "slate", label: "Ardoise", icon: "🌑", hue: 220, dark: true },
  { id: "midnight", label: "Minuit", icon: "🌃", hue: 240, dark: true },
  { id: "charcoal", label: "Charbon", icon: "⚫", hue: 30, dark: true },
  { id: "forest", label: "Forêt", icon: "🌲", hue: 140, dark: true },
  { id: "plum", label: "Prune", icon: "🍇", hue: 280, dark: true },
  { id: "navy", label: "Marine", icon: "⚓", hue: 220, dark: true },
  { id: "wine", label: "Vin", icon: "🍷", hue: 350, dark: true },
];

const STORAGE_KEY = "isb-color-theme";

export function getStoredThemeId(): string {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function applyTheme(hue: number, dark: boolean) {
  const root = document.documentElement;
  const bgLight = dark ? 8 : 97;
  const fgLight = dark ? 90 : 12;
  const satBg = dark ? 40 : 100;
  const satFg = dark ? 60 : 100;
  const satSec = dark ? 40 : 100;
  const satMut = dark ? 30 : 16;
  const satMutFg = dark ? 30 : 18;
  const satBorder = dark ? 30 : 100;
  const satAcc = dark ? 30 : 16;

  root.style.setProperty("--background", `${hue} ${satBg}% ${bgLight}%`);
  root.style.setProperty("--foreground", `${hue} ${satFg}% ${fgLight}%`);
  root.style.setProperty("--primary", dark ? `${hue} 60% 70%` : `${hue} 100% 12%`);
  root.style.setProperty("--primary-foreground", dark ? `${hue} 80% 20%` : `46 100% 50%`);
  root.style.setProperty("--card", dark ? `0 0% 12%` : `0 0% 100%`);
  root.style.setProperty("--card-foreground", `${hue} ${satFg}% ${fgLight}%`);
  root.style.setProperty("--secondary", `${hue} ${satSec}% ${dark ? 16 : 93}%`);
  root.style.setProperty("--border", `${hue} ${satBorder}% ${dark ? 24 : 88}%`);
  root.style.setProperty("--muted", `${hue} ${satMut}% ${dark ? 20 : 88}%`);
  root.style.setProperty("--muted-foreground", `${hue} ${satMutFg}% ${dark ? 60 : 48}%`);
  root.style.setProperty("--accent", `${hue} ${satAcc}% ${dark ? 20 : 88}%`);
  root.style.setProperty("--ring", dark ? `${hue} 60% 70%` : `${hue} 100% 12%`);
  root.style.setProperty("--destructive", `0 80% 50%`);
  root.style.setProperty("--destructive-foreground", `0 0% 100%`);
  root.classList.toggle("dark", dark);

  document.body.style.backgroundColor = `hsl(${hue} ${satBg}% ${bgLight}%)`;
  document.body.style.color = `hsl(${hue} ${satFg}% ${fgLight}%)`;
}

interface ThemeContextType {
  theme: ColorTheme;
  themes: ColorTheme[];
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || location.pathname.startsWith("/auth/");

  const [theme, setThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) return found;
    }
    return THEMES[0];
  });

  useEffect(() => {
    if (isLoginPage) {
      applyTheme(36, false);
    } else {
      applyTheme(theme.hue, theme.dark);
    }
  }, [theme, isLoginPage]);

  const setTheme = (id: string) => {
    const found = THEMES.find((t) => t.id === id);
    if (found) {
      applyTheme(found.hue, found.dark);
      setThemeState(found);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themes: THEMES, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
}
