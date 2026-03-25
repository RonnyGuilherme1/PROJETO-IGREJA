"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_MASTER_THEME,
  getMasterThemeStyle,
  MASTER_THEME_STORAGE_KEY,
  normalizeMasterTheme,
  type MasterTheme,
} from "@/modules/master/lib/master-theme";

interface MasterThemeContextValue {
  theme: MasterTheme;
  setTheme: (theme: MasterTheme) => void;
  toggleTheme: () => void;
}

interface MasterThemeScopeProps {
  children: ReactNode;
}

const MasterThemeContext = createContext<MasterThemeContextValue | null>(null);

export function MasterThemeScope({ children }: MasterThemeScopeProps) {
  const [theme, setThemeState] = useState<MasterTheme>(DEFAULT_MASTER_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);

      try {
        setThemeState(
          normalizeMasterTheme(
            window.localStorage.getItem(MASTER_THEME_STORAGE_KEY),
          ),
        );
      } catch {
        setThemeState(DEFAULT_MASTER_THEME);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const setTheme = useCallback((nextTheme: MasterTheme) => {
    const normalizedTheme = normalizeMasterTheme(nextTheme);
    setThemeState(normalizedTheme);

    try {
      window.localStorage.setItem(MASTER_THEME_STORAGE_KEY, normalizedTheme);
    } catch {
      // Ignore storage errors and keep the in-memory selection.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const contextValue = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );
  const themeStyle = useMemo(() => getMasterThemeStyle(theme), [theme]);

  return (
    <MasterThemeContext.Provider value={contextValue}>
      <div
        data-master-theme={mounted ? theme : DEFAULT_MASTER_THEME}
        style={themeStyle}
        className="master-theme-shell min-h-screen bg-background text-foreground"
      >
        {children}
      </div>
    </MasterThemeContext.Provider>
  );
}

export function useMasterTheme() {
  const context = useContext(MasterThemeContext);

  if (!context) {
    throw new Error("useMasterTheme must be used within a MasterThemeScope");
  }

  return context;
}
