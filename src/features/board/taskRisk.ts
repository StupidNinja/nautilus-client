import type { Task } from "@/api/types";

export type TaskRisk = "Low" | "Medium" | "High";

const STALE_HOURS = 48;

export function isStaleReviewPr(task: Task): boolean {
  if (task.status !== "Review" || !task.prUrl || !task.statusUpdatedAt)
    return false;
  const updatedAt = new Date(task.statusUpdatedAt).getTime();
  const ageHours = (Date.now() - updatedAt) / (1000 * 60 * 60);
  return ageHours > STALE_HOURS;
}

function daysUntil(date?: string): number | null {
  if (!date) return null;
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export function getTaskRisk(task: Task): TaskRisk {
  const sprintEndsIn = daysUntil(task.sprint?.endDate);
  const points = task.storyPoints ?? 0;
  const unfinishedNearEnd = task.status !== "Done" && sprintEndsIn !== null;

  if (
    isStaleReviewPr(task) ||
    !task.assigneeId ||
    points >= 8 ||
    (unfinishedNearEnd && sprintEndsIn <= 2)
  ) {
    return "High";
  }

  if (
    points >= 5 ||
    (task.status === "Review" && Boolean(task.prUrl)) ||
    (unfinishedNearEnd && sprintEndsIn <= 5)
  ) {
    return "Medium";
  }

  return "Low";
}
