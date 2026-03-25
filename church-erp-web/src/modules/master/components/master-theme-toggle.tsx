"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMasterTheme } from "@/modules/master/components/master-theme-scope";

export function MasterThemeToggle() {
  const { theme, toggleTheme } = useMasterTheme();
  const isDarkTheme = theme === "dark";
  const label = isDarkTheme ? "Ativar modo claro" : "Ativar modo escuro";

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
      {isDarkTheme ? (
        <SunMedium className="size-4" />
      ) : (
        <MoonStar className="size-4" />
      )}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
