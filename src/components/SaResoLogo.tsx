interface SaResoLogoProps {
  size?: number;
  className?: string;
}

export function SaResoLogoIcon({ size = 48, className = "" }: SaResoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E90FF" />
          <stop offset="50%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#0047AB" />
        </linearGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1628" />
          <stop offset="100%" stopColor="#0D2657" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#bgGrad)" />
      <text
        x="32"
        y="46"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontWeight="900"
        fontSize="44"
        fill="url(#sGrad)"
      >
        S
      </text>
    </svg>
  );
}

export function SaResoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-white ${className}`}>
      <span
        style={{
          background: "linear-gradient(135deg, #1E90FF 0%, #00BFFF 50%, #0047AB 100%)",
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
          background: "linear-gradient(135deg, #00BFFF 0%, #1E90FF 100%)",
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
