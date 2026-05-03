import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ExternalLink,
  GitPullRequest,
  ListChecks,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { tasksApi } from "@/api/tasks";
import { usersApi } from "@/api/users";
import type { Project, Sprint, Task, TaskStatus, User } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getTaskRisk, isStaleReviewPr } from "./taskRisk";

const STATUS_OPTIONS: TaskStatus[] = ["ToDo", "InProgress", "Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

interface TaskDetailModalProps {
  open: boolean;
  task: Task;
  sprint?: Sprint | null;
  project?: Project | null;
  canUpdateStatus: boolean;
  canUseAi: boolean;
  canDelete: boolean;
  onClose: () => void;
  onUpdated: (task: Task) => void | Promise<void>;
  onDeleted: (taskId: string) => void | Promise<void>;
  onAiBreakdown: (task: Task) => void;
}

export const TaskDetailModal = ({
  open,
  task,
  sprint,
  project,
  canUpdateStatus,
  canUseAi,
  canDelete,
  onClose,
  onUpdated,
  onDeleted,
  onAiBreakdown,
}: TaskDetailModalProps) => {
  const [fullTask, setFullTask] = useState<Task>(task);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [prUrl, setPrUrl] = useState(task.prUrl ?? "");
  const [storyPoints, setStoryPoints] = useState(
    task.storyPoints?.toString() ?? "",
  );
  const [priority, setPriority] = useState(task.priority ?? "");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    Promise.all([tasksApi.getById(task.id), usersApi.list()])
      .then(([loadedTask, loadedUsers]) => {
        const enrichedTask = {
          ...loadedTask,
          sprint: loadedTask.sprint ?? sprint ?? undefined,
          project: loadedTask.project ?? project ?? sprint?.project,
        };
        setFullTask(enrichedTask);
        setUsers(loadedUsers);
        setTitle(enrichedTask.title);
        setDescription(enrichedTask.description ?? "");
        setStatus(enrichedTask.status);
        setAssigneeId(enrichedTask.assigneeId ?? "");
        setPrUrl(enrichedTask.prUrl ?? "");
        setStoryPoints(enrichedTask.storyPoints?.toString() ?? "");
        setPriority(enrichedTask.priority ?? "");
      })
      .catch(() => setError("Could not load task details."))
      .finally(() => setLoading(false));
  }, [open, project, sprint, task.id]);

  const displayTask = useMemo(
    () => ({
      ...fullTask,
      title,
      description,
      status,
      assigneeId: assigneeId || fullTask.assigneeId,
      prUrl,
      storyPoints: storyPoints ? Number(storyPoints) : undefined,
      priority,
      sprint: fullTask.sprint ?? sprint ?? undefined,
      project: fullTask.project ?? project ?? sprint?.project,
    }),
    [
      assigneeId,
      description,
      fullTask,
      prUrl,
      priority,
      project,
      sprint,
      status,
      storyPoints,
      title,
    ],
  );

  const risk = getTaskRisk(displayTask);
  const stale = isStaleReviewPr(displayTask);
  const taskSprint = fullTask.sprint ?? sprint;
  const taskProject = fullTask.project ?? project ?? sprint?.project;

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await tasksApi.update(task.id, {
        title,
        description,
        status,
        assigneeId: assigneeId || undefined,
        prUrl,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        priority: priority || undefined,
      });
      const enriched = {
        ...updated,
        sprint: fullTask.sprint ?? sprint ?? undefined,
        project: fullTask.project ?? project ?? sprint?.project,
      };
      setFullTask(enriched);
      await onUpdated(enriched);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete ${fullTask.key}? This removes it from the prototype board.`,
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      await tasksApi.delete(fullTask.id);
      await onDeleted(fullTask.id);
      onClose();
    } catch {
      setError("Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Task Details">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            void handleSave(event);
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="key">{fullTask.key}</Badge>
            <Badge variant="status" status={status} />
            <Badge variant="risk" risk={risk}>
              {risk} Risk
            </Badge>
            {stale && <Badge variant="warning">PR stale &gt; 48h</Badge>}
          </div>

          {stale && (
            <div className="flex items-center gap-2 rounded border border-[#fcd34d] bg-warning-bg px-3 py-2 text-body-sm text-warning">
              <AlertTriangle size={15} />
              Review has had a linked PR without status movement for more than
              48 hours.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <Input
              id="detail-title"
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor="detail-status"
                className="text-label-caps text-on-surface-variant"
              >
                Status
              </label>
              <select
                id="detail-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                disabled={!canUpdateStatus}
                className="w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ToDo"
                      ? "To Do"
                      : option === "InProgress"
                        ? "In Progress"
                        : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="detail-description"
              className="text-label-caps text-on-surface-variant"
            >
              Description
            </label>
            <textarea
              id="detail-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full resize-none rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="detail-assignee"
                className="text-label-caps text-on-surface-variant"
              >
                Assignee
              </label>
              <select
                id="detail-assignee"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                className="w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="detail-pr-url"
              label="Pull Request URL"
              type="url"
              value={prUrl}
              onChange={(event) => setPrUrl(event.target.value)}
              placeholder="https://github.com/org/repo/pull/1"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="detail-story-points"
              label="Story Points"
              type="number"
              min={0}
              max={100}
              value={storyPoints}
              onChange={(event) => setStoryPoints(event.target.value)}
              placeholder="5"
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor="detail-priority"
                className="text-label-caps text-on-surface-variant"
              >
                Priority
              </label>
              <select
                id="detail-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Not set</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 rounded border border-outline-variant bg-surface-low px-4 py-3 md:grid-cols-2">
            <div>
              <p className="text-label-caps text-on-surface-variant">Project</p>
              <p className="mt-1 text-body-md font-semibold text-on-surface">
                {taskProject?.name ?? fullTask.projectId}
              </p>
            </div>
            <div>
              <p className="text-label-caps text-on-surface-variant">Sprint</p>
              <p className="mt-1 text-body-md font-semibold text-on-surface">
                {taskSprint?.name ?? "Backlog"}
              </p>
            </div>
          </div>

          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md font-medium text-primary hover:underline"
            >
              <GitPullRequest size={16} />
              Open linked pull request
              <ExternalLink size={13} />
            </a>
          )}

          <div className="rounded border border-outline-variant bg-surface-lowest">
            <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-3">
              <ListChecks size={16} className="text-primary" />
              <h3 className="text-body-md font-semibold text-on-surface">
                Subtasks ({fullTask.subtasks?.length ?? 0})
              </h3>
            </div>
            <div className="flex flex-col gap-2 px-4 py-3">
              {fullTask.subtasks && fullTask.subtasks.length > 0 ? (
                fullTask.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-body-sm text-on-surface">
                      {subtask.title}
                    </span>
                    <Badge variant="status" status={subtask.status} />
                  </div>
                ))
              ) : (
                <p className="text-body-sm text-on-surface-variant">
                  No subtasks have been accepted yet.
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-body-sm text-error">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
            <div className="flex gap-2">
              {canUseAi && status === "ToDo" && !fullTask.parentId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    onAiBreakdown(displayTask);
                  }}
                >
                  <Sparkles size={15} />
                  AI Breakdown
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    void handleDelete();
                  }}
                  loading={deleting}
                >
                  <Trash2 size={15} />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                <Save size={15} />
                Save
              </Button>
            </div>
          </div>
        </form>
      )}
    </Drawer>
  );
};
