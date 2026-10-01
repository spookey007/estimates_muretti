type LogoSize = "sm" | "md" | "lg";

const sizeClass: Record<LogoSize, string> = {
  sm: "h-6 w-auto max-w-[140px] sm:h-7 sm:max-w-[160px]",
  md: "h-8 w-auto max-w-[180px] sm:h-9 sm:max-w-[200px]",
  lg: "h-10 w-auto max-w-[220px] sm:h-11 sm:max-w-[260px]",
};

/**
 * Official Muretti mark from local `public/muretti-logo.png`.
 * Uses a plain <img> so production does not depend on /_next/image optimization.
 */
export function MurettiLogo({
  size = "md",
  className = "",
}: {
  size?: LogoSize;
  className?: string;
  /** Kept for call-site compatibility; unused with plain img. */
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/muretti-logo.png"
        alt="Muretti"
        width={307}
        height={66}
        decoding="async"
        className={`${sizeClass[size]} object-contain object-left`}
      />
    </span>
  );
}
