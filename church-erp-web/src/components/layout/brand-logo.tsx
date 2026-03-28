"use client";

import { useState } from "react";
import { Building2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeTenantLogoUrl } from "@/lib/tenant-branding";

const PLATFORM_LOGO_FALLBACK_SRC = "/platform-logo.png";

interface BrandLogoProps {
  alt: string;
  logoUrl?: string | null;
  icon?: LucideIcon;
  className?: string;
  imageClassName?: string;
  fallbackImageClassName?: string;
  iconClassName?: string;
}

export function BrandLogo({
  alt,
  logoUrl,
  icon: Icon = Building2,
  className,
  imageClassName,
  fallbackImageClassName,
  iconClassName,
}: BrandLogoProps) {
  const normalizedLogoUrl = normalizeTenantLogoUrl(logoUrl, {
    resolveRelative: true,
  });
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [hasFallbackLogoError, setHasFallbackLogoError] = useState(false);
  const canRenderCustomLogo =
    Boolean(normalizedLogoUrl) && failedLogoUrl !== normalizedLogoUrl;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {normalizedLogoUrl && canRenderCustomLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={normalizedLogoUrl}
          src={normalizedLogoUrl}
          alt={alt}
          className={cn("h-full w-full object-contain", imageClassName)}
          onError={() => setFailedLogoUrl(normalizedLogoUrl)}
        />
      ) : !hasFallbackLogoError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PLATFORM_LOGO_FALLBACK_SRC}
          alt={alt}
          className={cn(
            "h-full w-full object-contain",
            imageClassName,
            fallbackImageClassName,
          )}
          onError={() => setHasFallbackLogoError(true)}
        />
      ) : (
        <Icon className={cn("size-5", iconClassName)} />
      )}
    </div>
  );
}
