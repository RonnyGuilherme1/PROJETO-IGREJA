"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMasterTheme } from "@/modules/master/components/master-theme-scope";

export function MasterThemeToggle() {
  const { theme, toggleTheme } = useMasterTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const isDarkTheme = mounted && theme === "dark";
  const label = mounted
    ? isDarkTheme
      ? "Ativar modo claro"
      : "Ativar modo escuro"
    : "Alternar tema master";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="rounded-full bg-card/80"
    >
      {mounted && isDarkTheme ? (
        <SunMedium className="size-4" />
      ) : (
        <MoonStar className="size-4" />
      )}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
