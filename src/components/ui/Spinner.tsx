interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export const Spinner = ({ size = "md", className = "" }: SpinnerProps) => (
  <span
    role="status"
    aria-label="Loading"
    className={[
      "inline-block animate-spin rounded-full",
      "border-2 border-outline-variant border-t-primary",
      sizeClasses[size],
      className,
    ].join(" ")}
  />
);
