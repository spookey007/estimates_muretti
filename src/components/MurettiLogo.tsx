"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg";
type LogoTone = "dark" | "light";

const sizeClass: Record<LogoSize, string> = {
  sm: "h-7 w-auto max-w-[150px] sm:h-8 sm:max-w-[170px]",
  md: "h-9 w-auto max-w-[190px] sm:h-10 sm:max-w-[220px]",
  lg: "h-11 w-auto max-w-[240px] sm:h-12 sm:max-w-[280px]",
};

const srcByTone: Record<LogoTone, string> = {
  // white wordmark on dark — for dark headers / brand panels
  dark: "/muretti-logo-dark.jpg",
  // dark wordmark on light — for light surfaces
  light: "/muretti-logo-light.jpg",
};

export function MurettiLogo({
  size = "md",
  tone = "dark",
  className = "",
  priority = false,
}: {
  size?: LogoSize;
  tone?: LogoTone;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src={srcByTone[tone]}
        alt="muretti"
        width={360}
        height={90}
        priority={priority}
        className={`${sizeClass[size]} object-contain object-left`}
      />
    </span>
  );
}
