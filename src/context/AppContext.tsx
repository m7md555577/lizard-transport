import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "fr" | "ar";
export type Theme = "light" | "dark";

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  theme: "light",
  toggleTheme: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("lang") as Lang;
    return (["en", "fr", "ar"] as Lang[]).includes(stored) ? stored : "en";
  });
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("theme") as Theme) ?? "light"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const toggleLang = () => setLangState(l => l === "en" ? "fr" : l === "fr" ? "ar" : "en");
  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return (
    <AppContext.Provider value={{ lang, setLang, toggleLang, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
