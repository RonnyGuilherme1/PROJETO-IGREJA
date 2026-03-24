import type { ReactNode } from "react";
import {
  getTenantThemeStyle,
  normalizeTenantTheme,
  type TenantThemeKey,
} from "@/lib/tenant-branding";

interface TenantThemeScopeProps {
  children: ReactNode;
  themeKey?: TenantThemeKey | string | null;
}

export function TenantThemeScope({
  children,
  themeKey,
}: TenantThemeScopeProps) {
  const normalizedTheme = normalizeTenantTheme(themeKey);

  return (
    <div
      data-tenant-theme={normalizedTheme}
      className="tenant-theme-shell min-h-screen bg-background text-foreground"
      style={getTenantThemeStyle(normalizedTheme)}
    >
      {children}
    </div>
  );
}
