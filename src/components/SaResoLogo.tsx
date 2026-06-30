import { useId } from "react";

interface SaResoLogoProps {
  size?: number;
  className?: string;
}

/**
 * Ornamental vintage-style "S" logo for SaResO.
 * The S is drawn as a bold calligraphic stroke with:
 *  - Animated blue gradient cycling through navy → royal → dodger → sky → back
 *  - Inner hairline highlight stroke for depth
 *  - Horizontal serif bars at the terminals (vintage/classical feel)
 *  - Double ornamental border with corner diamond accents
 */
export function SaResoLogoIcon({ size = 48, className = "" }: SaResoLogoProps) {
  const id = useId().replace(/:/g, "");

  // S center path: upper-right → sweeps left over top bowl → crosses center → sweeps right through bottom bowl → lower-left
  // Tangent at start (76,25): leftward (classic S terminal) → horizontal serif bar
  // Tangent at end  (40,105): leftward (classic S terminal) → horizontal serif bar
  const S =
    "M 76,25 C 67,25 53,16 40,18 C 25,20 18,31 18,44 C 18,57 33,65 60,70 C 87,74 102,82 102,94 C 102,106 87,112 66,112 C 51,112 51,105 40,105";

  const dur = "5s";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="SaResO"
    >
      <defs>
        {/* ── Background ── */}
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#060E1C" />
          <stop offset="100%" stopColor="#0B1A35" />
        </linearGradient>

        {/* ── Main S gradient – cycles through blue tones ── */}
        <linearGradient id={`${id}main`} x1="60" y1="10" x2="60" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD">
            <animate attributeName="stop-color"
              values="#BAE6FD;#1E90FF;#0D3B8C;#63B3ED;#BAE6FD"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="35%" stopColor="#2563EB">
            <animate attributeName="stop-color"
              values="#2563EB;#0D3B8C;#63B3ED;#1E90FF;#2563EB"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="65%" stopColor="#1E3A8A">
            <animate attributeName="stop-color"
              values="#1E3A8A;#7DD3FC;#0D3B8C;#2563EB;#1E3A8A"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#7DD3FC">
            <animate attributeName="stop-color"
              values="#7DD3FC;#BAE6FD;#1E90FF;#0D3B8C;#7DD3FC"
              dur={dur} repeatCount="indefinite" />
          </stop>
        </linearGradient>

        {/* ── Inner highlight gradient (lighter, static) ── */}
        <linearGradient id={`${id}hi`} x1="60" y1="10" x2="60" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#7DD3FC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.85" />
        </linearGradient>

        {/* ── Serif & ornament colour ── */}
        <linearGradient id={`${id}serif`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#63B3ED">
            <animate attributeName="stop-color"
              values="#63B3ED;#BAE6FD;#1E90FF;#63B3ED"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#1E90FF">
            <animate attributeName="stop-color"
              values="#1E90FF;#63B3ED;#BAE6FD;#1E90FF"
              dur={dur} repeatCount="indefinite" />
          </stop>
        </linearGradient>

        {/* ── Soft glow on the S ── */}
        <filter id={`${id}glow`} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.12  0 0 0 0 0.56  0 0 0 0 1  0 0 0 0.55 0" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect width="120" height="120" rx="22" fill={`url(#${id}bg)`} />

      {/* ── Outer ornamental border ── */}
      <rect x="3" y="3" width="114" height="114" rx="20"
        fill="none" stroke="#1E3A8A" strokeWidth="1.5" strokeOpacity="0.65" />
      {/* ── Inner border ── */}
      <rect x="6.5" y="6.5" width="107" height="107" rx="17.5"
        fill="none" stroke="#2563EB" strokeWidth="0.6" strokeOpacity="0.35" />

      {/* ── Corner diamond ornaments ── */}
      {/* top-left */}
      <polygon points="14,11 17,8 20,11 17,14" fill="#1E3A8A" fillOpacity="0.7" />
      {/* top-right */}
      <polygon points="100,11 103,8 106,11 103,14" fill="#1E3A8A" fillOpacity="0.7" />
      {/* bottom-left */}
      <polygon points="14,109 17,106 20,109 17,112" fill="#1E3A8A" fillOpacity="0.7" />
      {/* bottom-right */}
      <polygon points="100,109 103,106 106,109 103,112" fill="#1E3A8A" fillOpacity="0.7" />

      {/* ── TOP serif bar  (terminal at 76,25, tangent leftward) ── */}
      {/* wide horizontal bar */}
      <rect x="62" y="21.5" width="28" height="6" rx="1.5"
        fill={`url(#${id}serif)`} opacity="0.95" />
      {/* left cap */}
      <rect x="60" y="20" width="6" height="9" rx="1.2"
        fill={`url(#${id}serif)`} />
      {/* right cap */}
      <rect x="86" y="20" width="6" height="9" rx="1.2"
        fill={`url(#${id}serif)`} />

      {/* ── BOTTOM serif bar (terminal at 40,105, tangent leftward) ── */}
      {/* wide horizontal bar */}
      <rect x="28" y="101" width="28" height="6" rx="1.5"
        fill={`url(#${id}serif)`} opacity="0.95" />
      {/* left cap */}
      <rect x="26" y="99.5" width="6" height="9" rx="1.2"
        fill={`url(#${id}serif)`} />
      {/* right cap */}
      <rect x="52" y="99.5" width="6" height="9" rx="1.2"
        fill={`url(#${id}serif)`} />

      {/* ── Drop-shadow copy of S (adds depth) ── */}
      <path
        d={S}
        stroke="#020810"
        strokeWidth="16"
        strokeLinecap="butt"
        fill="none"
        transform="translate(1.5,2)"
        strokeOpacity="0.5"
      />

      {/* ── Main S stroke ── */}
      <path
        d={S}
        stroke={`url(#${id}main)`}
        strokeWidth="14"
        strokeLinecap="butt"
        fill="none"
        filter={`url(#${id}glow)`}
      />

      {/* ── Inner highlight hairline ── */}
      <path
        d={S}
        stroke={`url(#${id}hi)`}
        strokeWidth="3.5"
        strokeLinecap="butt"
        fill="none"
        strokeOpacity="0.8"
      />

      {/* ── Ultra-fine centre line for vintage engraving look ── */}
      <path
        d={S}
        stroke="#E0F2FE"
        strokeWidth="0.8"
        strokeLinecap="butt"
        fill="none"
        strokeOpacity="0.35"
      />
    </svg>
  );
}

export function SaResoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span
        style={{
          background:
            "linear-gradient(135deg, #BAE6FD 0%, #1E90FF 40%, #1E3A8A 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Sa
      </span>
      <span className="text-white">Re</span>
      <span
        style={{
          background:
            "linear-gradient(135deg, #7DD3FC 0%, #2563EB 60%, #1E3A8A 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        sO
      </span>
    </span>
  );
}
