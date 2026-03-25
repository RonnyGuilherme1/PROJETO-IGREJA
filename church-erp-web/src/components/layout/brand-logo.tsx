"use client";

import { useState } from "react";
import { Building2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeTenantLogoUrl } from "@/lib/tenant-branding";

interface BrandLogoProps {
  alt: string;
  logoUrl?: string | null;
  icon?: LucideIcon;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
}

export function BrandLogo({
  alt,
  logoUrl,
  icon: Icon = Building2,
  className,
  imageClassName,
  iconClassName,
}: BrandLogoProps) {
  const normalizedLogoUrl = normalizeTenantLogoUrl(logoUrl);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const canRenderCustomLogo =
    Boolean(normalizedLogoUrl) && failedLogoUrl !== normalizedLogoUrl;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {normalizedLogoUrl && canRenderCustomLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizedLogoUrl}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() => setFailedLogoUrl(normalizedLogoUrl)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className={cn("size-5", iconClassName)} />
        </div>
      )}
    </div>
  );
}
