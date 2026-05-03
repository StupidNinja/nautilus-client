import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-caps text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-md px-3 py-2 text-body-md text-on-surface",
            "border bg-surface-lowest placeholder:text-outline",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            error
              ? "border-error focus:ring-error"
              : "border-outline-variant hover:border-outline",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-body-sm text-error">{error}</p>}
        {hint && !error && (
          <p className="text-body-sm text-on-surface-variant">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
