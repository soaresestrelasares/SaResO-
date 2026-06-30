interface BadgeProps {
  isPremium?: boolean;
  isVerified?: boolean;
  size?: "sm" | "md";
}

export function UserBadge({ isPremium, isVerified, size = "sm" }: BadgeProps) {
  const dim = size === "sm" ? "w-4 h-4 text-[9px]" : "w-5 h-5 text-[11px]";
  if (isVerified) {
    return (
      <span
        title="Conta verificada"
        className={`inline-flex items-center justify-center ${dim} rounded-full bg-green-500 text-white font-bold flex-shrink-0`}
      >
        ✓
      </span>
    );
  }
  if (isPremium) {
    return (
      <span
        title="Membro Premium"
        className={`inline-flex items-center justify-center ${dim} rounded-full bg-orange-500 text-white font-bold flex-shrink-0`}
      >
        ★
      </span>
    );
  }
  return null;
}
