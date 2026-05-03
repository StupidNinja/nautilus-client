import {
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Link2,
  UserRound,
  ListChecks,
} from "lucide-react";
import type { Task, TaskStatus } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getTaskRisk, isStaleReviewPr } from "./taskRisk";

interface TaskCardProps {
  task: Task;
  onOpen?: () => void;
  onMoveNext?: () => void;
  onAiBreakdown?: () => void;
  canUpdateStatus: boolean;
  canUseAi: boolean;
}

const STATUS_NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  ToDo: "InProgress",
  InProgress: "Review",
  Review: "Done",
};

export const TaskCard = ({
  task,
  onOpen,
  onMoveNext,
  onAiBreakdown,
  canUpdateStatus,
  canUseAi,
}: TaskCardProps) => {
  const stale = isStaleReviewPr(task);
  const risk = getTaskRisk(task);
  const nextStatus = STATUS_NEXT[task.status];

  return (
    <div
      id={`task-card-${task.id}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={[
        "rounded-lg border bg-surface-lowest p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md",
        onOpen
          ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          : "",
        stale
          ? "border-l-4 border-l-[#f59e0b] border-outline-soft"
          : "border-outline-soft",
      ].join(" ")}
    >
      {/* Stale PR warning banner */}
      {stale && (
        <div className="mb-3 flex items-center gap-1.5 rounded bg-[#fffbeb] border border-[#fcd34d] px-2.5 py-1.5">
          <AlertTriangle size={13} className="text-[#d97706] shrink-0" />
          <span className="text-[11px] font-semibold text-[#92400e]">
            Stale PR — no update for 48+ hours
          </span>
        </div>
      )}

      {/* Key + Badge row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="key">{task.key}</Badge>
          {task.parentId && <Badge variant="default">Subtask</Badge>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="risk" risk={risk}>
            {risk} Risk
          </Badge>
          <Badge variant="status" status={task.status} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-body-md font-semibold text-on-surface leading-snug">
        {task.title}
      </h3>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1.5 text-body-sm text-on-surface-variant line-clamp-2">
          {task.description}
        </p>
      )}

      {/* PR URL */}
      {task.prUrl && (
        <a
          href={task.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center gap-1.5 text-body-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Link2 size={12} />
          <span className="truncate max-w-[180px]">Pull Request</span>
          <ExternalLink size={11} className="shrink-0" />
        </a>
      )}

      {/* Assignee */}
      {task.assignee && (
        <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <UserRound size={13} />
          {task.assignee.email.split("@")[0]}
        </p>
      )}

      {/* Subtasks count */}
      {task.subtasks && task.subtasks.length > 0 && (
        <p className="mt-1.5 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <ListChecks size={13} />
          {task.subtasks.length} subtask{task.subtasks.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-outline-soft">
        {canUpdateStatus && nextStatus && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onMoveNext?.();
            }}
            className="flex-1 text-xs gap-1"
          >
            Move to {nextStatus === "InProgress" ? "In Progress" : nextStatus}
            <ChevronRight size={13} />
          </Button>
        )}
        {canUseAi && task.status === "ToDo" && !task.parentId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onAiBreakdown?.();
            }}
            title="AI Breakdown"
            className="shrink-0 gap-1 text-xs text-primary"
          >
            <Sparkles size={13} />
            AI
          </Button>
        )}
      </div>
    </div>
  );
};
