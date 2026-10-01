"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg";

const sizeClass: Record<LogoSize, string> = {
  sm: "h-6 w-auto max-w-[140px] sm:h-7 sm:max-w-[160px]",
  md: "h-8 w-auto max-w-[180px] sm:h-9 sm:max-w-[200px]",
  lg: "h-10 w-auto max-w-[220px] sm:h-11 sm:max-w-[260px]",
};

/** Official Muretti mark from https://www.muretti.com/logo.avif (white wordmark). */
export function MurettiLogo({
  size = "md",
  className = "",
  priority = false,
}: {
  size?: LogoSize;
  /** @deprecated Official logo is white; always shown on dark brand surfaces. */
  tone?: "dark" | "light";
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/muretti-logo.avif"
        alt="muretti"
        width={280}
        height={64}
        priority={priority}
        className={`${sizeClass[size]} object-contain object-left`}
      />
    </span>
  );
}
