import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "icon" | "full";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

const variantClasses: Record<
  BrandLogoVariant,
  {
    container: string;
    image: string;
    src: string;
    sizes: string;
  }
> = {
  icon: {
    container: "relative isolate size-14 shrink-0 sm:size-16",
    image: "object-contain scale-[1.96]",
    src: "/platform-logo.png",
    sizes: "(max-width: 640px) 56px, 64px",
  },
  full: {
    container:
      "relative isolate h-[168px] w-[112px] shrink-0 sm:h-[210px] sm:w-[140px] lg:h-[252px] lg:w-[168px]",
    image: "object-contain scale-[1.58]",
    src: "/platform-logo-full.png",
    sizes: "(max-width: 640px) 112px, (max-width: 1024px) 140px, 168px",
  },
};

export function BrandLogo({
  variant = "icon",
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const currentVariant = variantClasses[variant];

  return (
    <div className={cn(currentVariant.container, className)}>
      <Image
        src={currentVariant.src}
        alt="Igreja ERP"
        fill
        priority={priority}
        sizes={currentVariant.sizes}
        className={cn(
          "relative z-10 select-none p-[8%] drop-shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
          currentVariant.image,
          imageClassName,
        )}
      />
    </div>
  );
}
