import type { TaskStatus } from "@/api/types";
import type { TaskRisk } from "@/features/board/taskRisk";

type BadgeVariant = "status" | "key" | "warning" | "risk" | "default";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: TaskStatus;
  risk?: TaskRisk;
  className?: string;
}

const statusClasses: Record<TaskStatus, string> = {
  ToDo: "bg-surface-base text-on-surface-variant",
  InProgress: "bg-primary-fixed text-on-primary-fixed-variant",
  Review: "bg-secondary-container text-on-secondary-container",
  Done: "bg-[#f0fdf4] text-[#166534]",
};

const riskClasses: Record<TaskRisk, string> = {
  Low: "bg-success-bg text-success",
  Medium: "bg-warning-bg text-warning",
  High: "bg-danger-bg text-danger",
};

const statusLabels: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

export const Badge = ({
  children,
  variant = "default",
  status,
  risk,
  className = "",
}: BadgeProps) => {
  if (variant === "status" && status) {
    return (
      <span
        className={[
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-label-caps font-semibold",
          statusClasses[status],
          className,
        ].join(" ")}
      >
        {statusLabels[status]}
      </span>
    );
  }

  if (variant === "key") {
    return (
      <span
        className={[
          "inline-flex items-center px-2 py-0.5 rounded text-data-mono",
          "bg-primary-fixed text-on-primary-fixed-variant font-medium",
          className,
        ].join(" ")}
      >
        {children}
      </span>
    );
  }

  if (variant === "warning") {
    return (
      <span
        className={[
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-label-caps font-semibold",
          "bg-warning-bg text-warning",
          className,
        ].join(" ")}
      >
        {children}
      </span>
    );
  }

  if (variant === "risk" && risk) {
    return (
      <span
        className={[
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-label-caps font-semibold",
          riskClasses[risk],
          className,
        ].join(" ")}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-label-caps",
        "bg-surface-high text-on-surface-variant",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
};
