"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  applyMasterTheme,
  DEFAULT_MASTER_THEME,
  getMasterThemeHydrationScript,
  MASTER_THEME_ATTRIBUTE,
  MASTER_THEME_STORAGE_KEY,
  MASTER_THEME_STYLE_KEYS,
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

function getInitialTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_MASTER_THEME;
  }

  try {
    return normalizeMasterTheme(
      window.localStorage.getItem(MASTER_THEME_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_MASTER_THEME;
  }
}

export function MasterThemeScope({ children }: MasterThemeScopeProps) {
  const [theme, setThemeState] = useState<MasterTheme>(getInitialTheme);

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

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousAttribute = root.getAttribute(MASTER_THEME_ATTRIBUTE);
    const previousColorScheme = root.style.colorScheme;
    const previousStyles = new Map<string, string>();

    for (const key of MASTER_THEME_STYLE_KEYS) {
      previousStyles.set(key, root.style.getPropertyValue(key));
    }

    applyMasterTheme(root, theme);

    return () => {
      if (previousAttribute === null) {
        root.removeAttribute(MASTER_THEME_ATTRIBUTE);
      } else {
        root.setAttribute(MASTER_THEME_ATTRIBUTE, previousAttribute);
      }

      for (const key of MASTER_THEME_STYLE_KEYS) {
        const previousValue = previousStyles.get(key);

        if (previousValue) {
          root.style.setProperty(key, previousValue);
        } else {
          root.style.removeProperty(key);
        }
      }

      if (previousColorScheme) {
        root.style.colorScheme = previousColorScheme;
      } else {
        root.style.removeProperty("color-scheme");
      }
    };
  }, [theme]);

  const contextValue = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: getMasterThemeHydrationScript() }} />
      <MasterThemeContext.Provider value={contextValue}>
        <div
          data-master-theme={theme}
          className="master-theme-shell min-h-screen bg-background text-foreground"
          suppressHydrationWarning
        >
          {children}
        </div>
      </MasterThemeContext.Provider>
    </>
  );
}

export function useMasterTheme() {
  const context = useContext(MasterThemeContext);

  if (!context) {
    throw new Error("useMasterTheme must be used within a MasterThemeScope");
  }

  return context;
}
