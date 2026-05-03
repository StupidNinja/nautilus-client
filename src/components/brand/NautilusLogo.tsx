import logoUrl from "@/visuals/logo.png";

type NautilusLogoProps = {
  compact?: boolean;
  className?: string;
};

export const NautilusLogo = ({
  compact = false,
  className = "",
}: NautilusLogoProps) => {
  if (compact) {
    return (
      <img
        src={logoUrl}
        alt="Nautilus"
        className={[
          "h-16 w-16 shrink-0 rounded-2xl border border-white/15 bg-[#dff3ff] object-contain p-0 scale-[1.15] shadow-sm",
          className,
        ].join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "shrink-0 overflow-hidden border border-white/20 bg-[#dff3ff] shadow-sm",
        "h-24 w-48 rounded-xl",
        className,
      ].join(" ")}
    >
      <img
        src={logoUrl}
        alt="Nautilus"
        className="h-full w-full scale-[2.1] object-cover"
      />
    </div>
  );
};
