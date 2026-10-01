"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg";

const sizeClass: Record<LogoSize, string> = {
  sm: "h-7 w-auto max-w-[140px] sm:h-8 sm:max-w-[160px]",
  md: "h-9 w-auto max-w-[180px] sm:h-10 sm:max-w-[200px]",
  lg: "h-11 w-auto max-w-[220px] sm:h-12 sm:max-w-[260px]",
};

export function MurettiLogo({
  size = "md",
  className = "",
  priority = false,
}: {
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/muretti-logo.jpg"
        alt="Muretti"
        width={320}
        height={80}
        priority={priority}
        className={`${sizeClass[size]} object-contain object-left`}
      />
    </span>
  );
}
