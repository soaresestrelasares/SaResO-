import { useId } from "react";

interface SaResoLogoProps {
  size?: number;
  className?: string;
}

export function SaResoLogoIcon({ size = 48, className = "" }: SaResoLogoProps) {
  return <SaResoLogoBase size={size} className={className} variant="dark" />;
}

export function SaResoLogoIconLight({ size = 48, className = "" }: SaResoLogoProps) {
  return <SaResoLogoBase size={size} className={className} variant="light" />;
}

/**
 * Dois "S" entrelaçados em caligrafia vintage anos 50.
 * - Traços finos nas pontas, grossos no centro (contrast typography)
 * - Serifas altas e elegantes com pequenas esferas nos remates
 * - Brilho cromado azul e verde
 * - Variante escura (fundo escuro) e clara (fundo branco)
 */
function SaResoLogoBase({
  size = 48,
  className = "",
  variant,
}: SaResoLogoProps & { variant: "dark" | "light" }) {
  const id = useId().replace(/:/g, "");
  const dur = "8s";
  const isLight = variant === "light";

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
        <radialGradient id={`${id}bg`} cx="50%" cy="45%" r="72%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isLight ? "#FFFFFF" : "#0A1528"} />
          <stop offset="100%" stopColor={isLight ? "#F1F5F9" : "#02040A"} />
        </radialGradient>

        <linearGradient
          id={`${id}blue`}
          x1="10"
          y1="10"
          x2="110"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#DBEAFE">
            <animate
              attributeName="stop-color"
              values="#DBEAFE;#60A5FA;#1E3A8A;#93C5FD;#DBEAFE"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="25%" stopColor="#3B82F6">
            <animate
              attributeName="stop-color"
              values="#3B82F6;#2563EB;#60A5FA;#1D4ED8;#3B82F6"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#1E40AF">
            <animate
              attributeName="stop-color"
              values="#1E40AF;#93C5FD;#3B82F6;#172554;#1E40AF"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="75%" stopColor="#60A5FA">
            <animate
              attributeName="stop-color"
              values="#60A5FA;#DBEAFE;#1E90FF;#60A5FA"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#93C5FD">
            <animate
              attributeName="stop-color"
              values="#93C5FD;#60A5FA;#DBEAFE;#93C5FD"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <linearGradient
          id={`${id}green`}
          x1="110"
          y1="110"
          x2="10"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#D1FAE5">
            <animate
              attributeName="stop-color"
              values="#D1FAE5;#34D399;#065F46;#6EE7B7;#D1FAE5"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="25%" stopColor="#10B981">
            <animate
              attributeName="stop-color"
              values="#10B981;#059669;#34D399;#047857;#10B981"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#065F46">
            <animate
              attributeName="stop-color"
              values="#065F46;#6EE7B7;#10B981;#022C22;#065F46"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="75%" stopColor="#34D399">
            <animate
              attributeName="stop-color"
              values="#34D399;#D1FAE5;#10B981;#34D399"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#6EE7B7">
            <animate
              attributeName="stop-color"
              values="#6EE7B7;#34D399;#D1FAE5;#6EE7B7"
              dur={dur}
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <linearGradient
          id={`${id}blueShine`}
          x1="10"
          y1="10"
          x2="110"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient
          id={`${id}greenShine`}
          x1="110"
          y1="110"
          x2="10"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.3" />
        </linearGradient>

        <filter id={`${id}glowB`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
          <feColorMatrix
            in="b"
            type="matrix"
            values="0 0 0 0 0.12  0 0 0 0 0.56  0 0 0 0 1  0 0 0 0.55 0"
            result="g"
          />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${id}glowG`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
          <feColorMatrix
            in="b"
            type="matrix"
            values="0 0 0 0 0.0  0 0 0 0 0.7  0 0 0 0 0.4  0 0 0 0.5 0"
            result="g"
          />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${id}retroShadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="1.5"
            dy="2.5"
            stdDeviation="1.5"
            floodColor="#000"
            floodOpacity={isLight ? "0.15" : "0.6"}
          />
        </filter>

        <clipPath id={`${id}cross`}>
          <ellipse cx="60" cy="60" rx="28" ry="20" transform="rotate(-8,60,60)" />
        </clipPath>
      </defs>

      <rect width="120" height="120" rx="22" fill={`url(#${id}bg)`} />

      <rect
        x="3"
        y="3"
        width="114"
        height="114"
        rx="20"
        fill="none"
        stroke="#1E3A8A"
        strokeWidth="1.4"
        strokeOpacity={isLight ? "0.35" : "0.6"}
      />
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="18"
        fill="none"
        stroke="#065F46"
        strokeWidth="0.8"
        strokeOpacity={isLight ? "0.25" : "0.45"}
      />

      <polygon
        points="14,11 17,8 20,11 17,14"
        fill="#1E3A8A"
        fillOpacity={isLight ? "0.5" : "0.75"}
      />
      <polygon
        points="100,11 103,8 106,11 103,14"
        fill="#065F46"
        fillOpacity={isLight ? "0.5" : "0.75"}
      />
      <polygon
        points="14,109 17,106 20,109 17,112"
        fill="#065F46"
        fillOpacity={isLight ? "0.5" : "0.75"}
      />
      <polygon
        points="100,109 103,106 106,109 103,112"
        fill="#1E3A8A"
        fillOpacity={isLight ? "0.5" : "0.75"}
      />

      <g filter={`url(#${id}retroShadow)`}>
        <FiftiesS
          fill={`url(#${id}blue)`}
          shine={`url(#${id}blueShine)`}
          glow={`url(#${id}glowB)`}
          accent="#93C5FD"
        />
      </g>

      <g transform="rotate(180,60,60)" filter={`url(#${id}retroShadow)`}>
        <FiftiesS
          fill={`url(#${id}green)`}
          shine={`url(#${id}greenShine)`}
          glow={`url(#${id}glowG)`}
          accent="#6EE7B7"
        />
      </g>

      <g clipPath={`url(#${id}cross)`}>
        <g transform="rotate(180,60,60)" filter={`url(#${id}retroShadow)`}>
          <FiftiesS
            fill={`url(#${id}green)`}
            shine={`url(#${id}greenShine)`}
            glow={`url(#${id}glowG)`}
            accent="#6EE7B7"
          />
        </g>
      </g>

      <g opacity={isLight ? "0.4" : "0.55"}>
        <FiftiesSPath fill="none" stroke="#FFFFFF" strokeWidth="0.7" />
      </g>
      <g opacity={isLight ? "0.4" : "0.55"} transform="rotate(180,60,60)">
        <FiftiesSPath fill="none" stroke="#FFFFFF" strokeWidth="0.7" />
      </g>
    </svg>
  );
}

function FiftiesS({
  fill,
  shine,
  glow,
  accent,
}: {
  fill: string;
  shine: string;
  glow: string;
  accent: string;
}) {
  return (
    <>
      <FiftiesSPath fill={fill} filter={glow} />
      <FiftiesSPath fill={shine} opacity="0.6" />
      <FiftiesSPath fill="none" stroke={accent} strokeWidth="0.6" strokeOpacity="0.5" />
    </>
  );
}

function FiftiesSPath(props: React.SVGProps<SVGPathElement>) {
  const d =
    "M 84,18 " +
    "C 74,15 58,13 46,16 C 33,19 24,29 24,42 " +
    "C 24,54 34,62 52,66 C 70,70 88,73 98,80 " +
    "C 105,85 109,92 109,99 C 109,108 101,114 89,117 " +
    "C 77,120 62,119 49,115 C 43,113 38,111 33,108 " +
    "C 30,105 26,104 23,107 C 20,110 20,115 24,117 C 28,119 33,118 36,114 " +
    "L 39,117 " +
    "C 56,119 73,123 91,119 C 107,115 117,106 117,92 " +
    "C 117,80 107,71 88,65 C 70,60 51,58 41,52 " +
    "C 35,49 33,44 33,40 C 33,32 41,26 53,24 " +
    "C 66,22 81,24 92,29 " +
    "C 96,31 100,30 102,26 C 104,22 102,17 97,16 C 93,15 88,17 86,21 " +
    "L 82,19 " +
    "C 85,15 91,12 97,13 C 104,15 108,20 106,26 " +
    "C 104,32 98,34 94,31 " +
    "Z";

  return <path d={d} strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function SaResoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span
        style={{
          background: "linear-gradient(135deg, #DBEAFE 0%, #3B82F6 45%, #1E3A8A 100%)",
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
          background: "linear-gradient(135deg, #D1FAE5 0%, #10B981 55%, #064E3B 100%)",
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
