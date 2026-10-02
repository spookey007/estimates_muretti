import { MURETTI_LOGO_DATA_URI } from "@/components/muretti-logo-data";

type LogoSize = "sm" | "md" | "lg";

const sizeClass: Record<LogoSize, string> = {
  sm: "h-6 w-auto max-w-[150px] sm:h-7 sm:max-w-[170px]",
  md: "h-8 w-auto max-w-[190px] sm:h-9 sm:max-w-[220px]",
  lg: "h-10 w-auto max-w-[240px] sm:h-11 sm:max-w-[280px]",
};

/**
 * Official Muretti logo (actual brand mark), inlined as a data URI so production
 * does not hit /_next/image or missing static files.
 */
export function MurettiLogo({
  size = "md",
  className = "",
}: {
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MURETTI_LOGO_DATA_URI}
        alt="Muretti"
        width={307}
        height={66}
        decoding="async"
        data-logo="muretti-official-png"
        className={`${sizeClass[size]} object-contain object-left`}
      />
    </span>
  );
}
