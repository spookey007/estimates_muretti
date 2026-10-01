type LogoSize = "sm" | "md" | "lg";

const sizeClass: Record<LogoSize, string> = {
  sm: "h-6 w-auto max-w-[150px] sm:h-7",
  md: "h-8 w-auto max-w-[190px] sm:h-9",
  lg: "h-10 w-auto max-w-[240px] sm:h-11",
};

/**
 * Official-style Muretti wordmark as inline SVG.
 * No /_next/image and no public file request — works even if static assets fail.
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
    <span
      className={`inline-flex items-center text-white ${sizeClass[size]} ${className}`}
      data-logo="muretti-inline-svg-v1"
      aria-label="Muretti"
    >
      <svg
        viewBox="0 0 307 66"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        role="img"
        aria-hidden="false"
      >
        <title>Muretti</title>
        {/* Title-case wordmark */}
        <text
          x="8"
          y="44"
          fill="currentColor"
          fontFamily="Arial, Helvetica, 'Segoe UI', sans-serif"
          fontSize="36"
          fontWeight="700"
          letterSpacing="-0.5"
        >
          Muretti
        </text>
        {/* Overline accent above "ur" */}
        <rect x="52" y="12" width="42" height="3.5" rx="1" fill="currentColor" />
        {/* Coral brand period */}
        <circle cx="196" cy="46" r="5.5" fill="#E8917A" />
      </svg>
    </span>
  );
}
