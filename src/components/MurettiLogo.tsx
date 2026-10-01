"use client";

import Image from "next/image";

export function MurettiLogo({
  className = "h-8 w-auto sm:h-9",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/muretti-logo.jpg"
      alt="Muretti"
      width={220}
      height={56}
      priority={priority}
      className={className}
    />
  );
}
