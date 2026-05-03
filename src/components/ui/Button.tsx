import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-sm hover:bg-primary-container focus-visible:ring-primary",
  secondary:
    "bg-surface-lowest text-on-surface border border-outline-soft hover:bg-surface-low focus-visible:ring-outline",
  danger:
    "bg-error text-on-error shadow-sm hover:opacity-90 focus-visible:ring-error",
  ghost:
    "text-on-surface-variant hover:bg-surface-base focus-visible:ring-outline",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-body-sm rounded-md",
  md: "px-4 py-2 text-body-md rounded-md",
  lg: "px-5 py-2.5 text-body-lg rounded-md",
};

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};
