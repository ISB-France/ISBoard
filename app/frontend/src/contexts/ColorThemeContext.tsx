import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ColorTheme {
  id: string;
  label: string;
  icon: string;
  hue: number;
  dark: boolean;
}

const THEMES: ColorTheme[] = [
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

function applyTheme(hue: number, dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.style.setProperty("--background", `${hue} 40% 8%`);
    root.style.setProperty("--foreground", `${hue} 60% 90%`);
    root.style.setProperty("--primary", `${hue} 60% 70%`);
    root.style.setProperty("--primary-foreground", `${hue} 80% 20%`);
    root.style.setProperty("--card", `0 0% 12%`);
    root.style.setProperty("--card-foreground", `${hue} 60% 90%`);
    root.style.setProperty("--secondary", `${hue} 40% 16%`);
    root.style.setProperty("--border", `${hue} 30% 24%`);
    root.style.setProperty("--muted", `${hue} 30% 20%`);
    root.style.setProperty("--muted-foreground", `${hue} 30% 60%`);
    root.style.setProperty("--accent", `${hue} 30% 20%`);
    root.style.setProperty("--ring", `${hue} 60% 70%`);
    root.classList.add("dark");
  } else {
    root.style.setProperty("--background", `${hue} 100% 97%`);
    root.style.setProperty("--foreground", `${hue} 100% 12%`);
    root.style.setProperty("--primary", `${hue} 100% 12%`);
    root.style.setProperty("--primary-foreground", `46 100% 50%`);
    root.style.setProperty("--card", `0 0% 100%`);
    root.style.setProperty("--card-foreground", `${hue} 100% 12%`);
    root.style.setProperty("--secondary", `${hue} 100% 93%`);
    root.style.setProperty("--border", `${hue} 100% 88%`);
    root.style.setProperty("--muted", `${hue} 16% 88%`);
    root.style.setProperty("--muted-foreground", `${hue} 18% 48%`);
    root.style.setProperty("--accent", `${hue} 16% 88%`);
    root.style.setProperty("--ring", `${hue} 100% 12%`);
    root.classList.remove("dark");
  }
}

interface ThemeContextType {
  theme: ColorTheme;
  themes: ColorTheme[];
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) return found;
    }
    return THEMES[0];
  });

  useEffect(() => {
    applyTheme(theme.hue, theme.dark);
  }, [theme]);

  const setTheme = (id: string) => {
    const found = THEMES.find((t) => t.id === id);
    if (found) {
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
