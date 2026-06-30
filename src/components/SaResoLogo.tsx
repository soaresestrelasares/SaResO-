import { useId } from "react";

interface SaResoLogoProps {
  size?: number;
  className?: string;
}

/**
 * Dois "S" entrelaçados em caligrafia vintage.
 * Cada S tem serifas ornamentais enroladas nas pontas (estilo letra capitular
 * antiga), variação de espessura e relevo suave. Um azul por cima, outro verde
 * por baixo, cruzando-se no centro como uma trança.
 */
export function SaResoLogoIcon({ size = 48, className = "" }: SaResoLogoProps) {
  const id = useId().replace(/:/g, "");

  const dur = "8s";

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
        {/* ── Fundo ── */}
        <radialGradient id={`${id}bg`} cx="50%" cy="45%" r="70%"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B162A" />
          <stop offset="100%" stopColor="#02040A" />
        </radialGradient>

        {/* ── Azul ── */}
        <linearGradient id={`${id}blue`} x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE">
            <animate attributeName="stop-color"
              values="#E0F2FE;#60A5FA;#1E40AF;#93C5FD;#E0F2FE"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="35%" stopColor="#1E90FF">
            <animate attributeName="stop-color"
              values="#1E90FF;#2563EB;#60A5FA;#1D4ED8;#1E90FF"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="70%" stopColor="#1E3A8A">
            <animate attributeName="stop-color"
              values="#1E3A8A;#93C5FD;#1E90FF;#172554;#1E3A8A"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#7DD3FC">
            <animate attributeName="stop-color"
              values="#7DD3FC;#E0F2FE;#3B82F6;#7DD3FC"
              dur={dur} repeatCount="indefinite" />
          </stop>
        </linearGradient>

        {/* ── Verde ── */}
        <linearGradient id={`${id}green`} x1="105" y1="110" x2="15" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D1FAE5">
            <animate attributeName="stop-color"
              values="#D1FAE5;#34D399;#065F46;#6EE7B7;#D1FAE5"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="35%" stopColor="#10B981">
            <animate attributeName="stop-color"
              values="#10B981;#059669;#34D399;#047857;#10B981"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="70%" stopColor="#064E3B">
            <animate attributeName="stop-color"
              values="#064E3B;#6EE7B7;#10B981;#022C22;#064E3B"
              dur={dur} repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#A7F3D0">
            <animate attributeName="stop-color"
              values="#A7F3D0;#D1FAE5;#22C55E;#A7F3D0"
              dur={dur} repeatCount="indefinite" />
          </stop>
        </linearGradient>

        {/* Brilhos */}
        <linearGradient id={`${id}blueHi`} x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${id}greenHi`} x1="105" y1="110" x2="15" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.2" />
        </linearGradient>

        <filter id={`${id}glowB`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
          <feColorMatrix in="b" type="matrix"
            values="0 0 0 0 0.12  0 0 0 0 0.56  0 0 0 0 1  0 0 0 0.55 0" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}glowG`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
          <feColorMatrix in="b" type="matrix"
            values="0 0 0 0 0.0  0 0 0 0 0.7  0 0 0 0 0.4  0 0 0 0.5 0" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Cruzamento central */}
        <clipPath id={`${id}cross`}>
          <ellipse cx="60" cy="60" rx="28" ry="20" transform="rotate(-8,60,60)" />
        </clipPath>
      </defs>

      {/* ── Fundo ── */}
      <rect width="120" height="120" rx="22" fill={`url(#${id}bg)`} />

      {/* ── Molduras ornamentais ── */}
      <rect x="3" y="3" width="114" height="114" rx="20"
        fill="none" stroke="#1E3A8A" strokeWidth="1.2" strokeOpacity="0.55" />
      <rect x="6" y="6" width="108" height="108" rx="18"
        fill="none" stroke="#065F46" strokeWidth="0.7" strokeOpacity="0.4" />

      {/* ── Ornamentos de canto ── */}
      <polygon points="14,11 17,8 20,11 17,14" fill="#1E3A8A" fillOpacity="0.7" />
      <polygon points="100,11 103,8 106,11 103,14" fill="#065F46" fillOpacity="0.7" />
      <polygon points="14,109 17,106 20,109 17,112" fill="#065F46" fillOpacity="0.7" />
      <polygon points="100,109 103,106 106,109 103,112" fill="#1E3A8A" fillOpacity="0.7" />

      {/* ═══════════════════════════════════════════
          S AZUL (base — por baixo no cruzamento)
          ═══════════════════════════════════════════ */}
      <g transform="translate(0.5,0.5)">
        <VintageS color={`url(#${id}blue)`} highlight={`url(#${id}blueHi)`} glow={`url(#${id}glowB)`} />
      </g>

      {/* ═══════════════════════════════════════════
          S VERDE (por cima no cruzamento, base fora)
          ═══════════════════════════════════════════ */}
      <g transform="rotate(180,60,60)">
        {/* fora do cruzamento — sombra/corpo */}
        <VintageS color={`url(#${id}green)`} highlight={`url(#${id}greenHi)`} glow={`url(#${id}glowG)`} />
      </g>

      {/* Verde por cima do azul no centro */}
      <g clipPath={`url(#${id}cross)`}>
        <g transform="rotate(180,60,60)">
          <VintageS color={`url(#${id}green)`} highlight={`url(#${id}greenHi)`} glow={`url(#${id}glowG)`} />
        </g>
      </g>

      {/* Contornos finais para separar bem os dois S */}
      <g opacity="0.6">
        <VintageSOutline stroke="#93C5FD" />
      </g>
      <g opacity="0.6" transform="rotate(180,60,60)">
        <VintageSOutline stroke="#6EE7B7" />
      </g>
    </svg>
  );
}

/** S vintage preenchido com sombra, corpo, relevo e hairline. */
function VintageS({ color, highlight, glow }: { color: string; highlight: string; glow: string }) {
  return (
    <>
      {/* Sombra profunda (relevo) */}
      <SPath fill="#000810" transform="translate(2,2)" opacity="0.45" />
      <SPath fill="#000810" transform="translate(1.5,1.5)" opacity="0.3" />
      {/* Corpo principal */}
      <SPath fill={color} filter={glow} />
      {/* Relevo interior */}
      <SPath fill={highlight} transform="translate(-1,-1)" opacity="0.55" />
      {/* Hairline */}
      <SPath fill="none" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.35" />
    </>
  );
}

/** S vintage com traço de contorno. */
function VintageSOutline({ stroke }: { stroke: string }) {
  return <SPath fill="none" stroke={stroke} strokeWidth="0.8" />;
}

/** Caminho do S vintage: caligrafia ornamental com serifas enroladas. */
function SPath(props: React.SVGProps<SVGPathElement>) {
  return (
    <path
      d={
        // Ponto inicial no terminal superior-direito (termina em voluta para cima)
        "M 84,18 " +
        "C 74,15 58,13 46,16 C 33,19 24,29 24,42 " +
        "C 24,54 34,62 52,66 C 70,70 88,73 98,80 " +
        "C 105,85 109,92 109,99 C 109,108 101,114 89,117 " +
        "C 77,120 62,119 49,115 C 43,113 38,111 34,108 " +
        // Voluta inferior esquerda ornamental
        "C 30,105 26,105 24,109 C 22,113 25,118 30,119 C 35,120 40,117 42,112 " +
        "L 46,114 " +
        // continua subida do S
        "C 56,119 73,123 88,119 C 106,115 117,106 117,92 " +
        "C 117,80 107,71 87,65 C 70,60 52,58 41,52 " +
        "C 33,48 30,42 30,37 C 30,28 38,22 50,20 " +
        "C 62,18 76,20 87,24 " +
        // Voluta superior direita ornamental
        "C 91,26 95,25 97,21 C 99,17 96,12 91,11 C 86,10 81,13 79,18 " +
        "L 75,16 " +
        "C 78,13 82,12 86,13 C 92,14 95,18 93,22 " +
        "C 91,26 87,27 84,25 " +
        "Z"
      }
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function SaResoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span
        style={{
          background: "linear-gradient(135deg, #E0F2FE 0%, #1E90FF 45%, #1E3A8A 100%)",
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
