import { useState, type FormEvent } from "react";
import { tasksApi } from "@/api/tasks";
import { usersApi } from "@/api/users";
import type { Task, User } from "@/api/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect } from "react";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  sprintId: string;
  onCreated: (task: Task) => void;
}

export const CreateTaskModal = ({
  open,
  onClose,
  projectId,
  sprintId,
  onCreated,
}: CreateTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [prUrl, setPrUrl] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [priority, setPriority] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      void usersApi.list().then(setUsers);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const task = await tasksApi.create({
        title,
        description: description || undefined,
        projectId,
        sprintId,
        assigneeId: assigneeId || undefined,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        priority: priority || undefined,
      });
      // If PR URL provided, update immediately
      if (prUrl) {
        const updated = await tasksApi.update(task.id, { prUrl });
        onCreated(updated);
      } else {
        onCreated(task);
      }
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setPrUrl("");
      setStoryPoints("");
      setPriority("");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task">
      <form
        id="create-task-form"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="flex flex-col gap-4"
      >
        <Input
          id="task-title"
          label="Title"
          placeholder="e.g. Implement JWT authentication"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-description"
            className="text-label-caps text-on-surface-variant"
          >
            Description (optional)
          </label>
          <textarea
            id="task-description"
            rows={3}
            placeholder="Describe the task in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded px-3 py-2 text-body-md text-on-surface border border-outline-variant bg-surface-lowest placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-assignee"
            className="text-label-caps text-on-surface-variant"
          >
            Assignee (optional)
          </label>
          <select
            id="task-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full rounded px-3 py-2 text-body-md text-on-surface border border-outline-variant bg-surface-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          >
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="task-pr-url"
          label="Pull Request URL (optional)"
          placeholder="https://github.com/org/repo/pull/1"
          type="url"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="task-story-points"
            label="Story Points (optional)"
            type="number"
            min={0}
            max={100}
            placeholder="5"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="task-priority"
              className="text-label-caps text-on-surface-variant"
            >
              Priority (optional)
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded px-3 py-2 text-body-md text-on-surface border border-outline-variant bg-surface-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">Not set</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        {error && <p className="text-body-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
