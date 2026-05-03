import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ChevronLeft } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { sprintsApi } from "@/api/sprints";
import { tasksApi } from "@/api/tasks";
import type { Task, TaskStatus, Sprint } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { AiBreakdownModal } from "./AiBreakdownModal";
import { TaskDetailModal } from "./TaskDetailModal";

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "ToDo", label: "To Do", accent: "bg-outline" },
  { status: "InProgress", label: "In Progress", accent: "bg-primary" },
  { status: "Review", label: "Review", accent: "bg-warning" },
  { status: "Done", label: "Done", accent: "bg-success" },
];

const COLUMN_IDS: TaskStatus[] = ["ToDo", "InProgress", "Review", "Done"];

const buildTaskOrder = (items: Task[]): Record<TaskStatus, string[]> => {
  const order: Record<TaskStatus, string[]> = {
    ToDo: [],
    InProgress: [],
    Review: [],
    Done: [],
  };
  items.forEach((task) => {
    order[task.status].push(task.id);
  });
  return order;
};

const getColumnId = (id: string): TaskStatus | null => {
  if (!id.startsWith("column-")) return null;
  const status = id.replace("column-", "") as TaskStatus;
  return COLUMN_IDS.includes(status) ? status : null;
};

const enrichTasks = (items: Task[], sprint: Sprint): Task[] =>
  items.map((task) => ({
    ...task,
    sprint,
    project: sprint.project,
  }));

interface SortableTaskCardProps {
  task: Task;
  onOpen: () => void;
  onMoveNext?: () => void;
  onAiBreakdown?: () => void;
  canUpdateStatus: boolean;
  canUseAi: boolean;
}

const SortableTaskCard = ({
  task,
  onOpen,
  onMoveNext,
  onAiBreakdown,
  canUpdateStatus,
  canUseAi,
}: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canUpdateStatus });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-60" : undefined}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onOpen={onOpen}
        canUpdateStatus={canUpdateStatus}
        canUseAi={canUseAi}
        onMoveNext={onMoveNext}
        onAiBreakdown={onAiBreakdown}
      />
    </div>
  );
};

interface BoardColumnProps {
  status: TaskStatus;
  label: string;
  accent: string;
  taskIds: string[];
  tasks: Task[];
  canUpdateStatus: boolean;
  canUseAi: boolean;
  onMoveNext: (task: Task) => void | Promise<void>;
  onAiBreakdown: (task: Task) => void;
  onOpenTask: (task: Task) => void;
}

const BoardColumn = ({
  status,
  label,
  accent,
  taskIds,
  tasks,
  canUpdateStatus,
  canUseAi,
  onMoveNext,
  onAiBreakdown,
  onOpenTask,
}: BoardColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });

  return (
    <div
      id={`board-column-${status.toLowerCase()}`}
      className="flex w-[292px] shrink-0 flex-col gap-3"
    >
      <div className="flex items-center justify-between rounded-lg border border-outline-soft bg-surface-lowest px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <span className="text-label-caps text-on-surface-variant">
            {label}
          </span>
        </div>
        <span className="text-data-mono text-on-surface-variant bg-surface-low px-2 py-1 rounded-md">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={[
            "flex flex-col gap-2.5 min-h-[120px] rounded-lg border border-dashed border-transparent p-1 transition-colors",
            isOver ? "border-primary bg-primary-fixed/30" : "bg-transparent",
          ].join(" ")}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task)}
              canUpdateStatus={canUpdateStatus}
              canUseAi={canUseAi}
              onMoveNext={() => {
                void onMoveNext(task);
              }}
              onAiBreakdown={() => onAiBreakdown(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-outline-soft bg-surface-lowest px-4 py-6 text-center">
              <p className="text-body-sm text-on-surface-variant/60">
                No tasks
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export const BoardPage = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const canUpdateStatus = hasPermission("update:task_status");
  const canCreateTask = hasPermission("create:task");
  const canUseAi = hasPermission("use:ai");

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiTask, setAiTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOrder, setTaskOrder] = useState<Record<TaskStatus, string[]>>({
    ToDo: [],
    InProgress: [],
    Review: [],
    Done: [],
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const tasksById = useMemo(() => {
    const map: Record<string, Task> = {};
    tasks.forEach((task) => {
      map[task.id] = task;
    });
    return map;
  }, [tasks]);

  const taskStatusById = useMemo(() => {
    const map: Record<string, TaskStatus> = {};
    COLUMN_IDS.forEach((status) => {
      taskOrder[status].forEach((id) => {
        map[id] = status;
      });
    });
    return map;
  }, [taskOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const refreshBoard = useCallback(
    async (showLoading = true) => {
      if (!sprintId) return;
      if (showLoading) {
        setLoading(true);
      }
      try {
        const [loadedSprint, loadedTasks] = await Promise.all([
          sprintsApi.getById(sprintId),
          sprintsApi.getTasks(sprintId),
        ]);
        const enrichedTasks = enrichTasks(loadedTasks, loadedSprint);
        setSprint(loadedSprint);
        setTasks(enrichedTasks);
        setTaskOrder(buildTaskOrder(enrichedTasks));
        setSelectedTask((current) =>
          current
            ? (enrichedTasks.find((task) => task.id === current.id) ?? null)
            : null,
        );
        setAiTask((current) =>
          current
            ? (enrichedTasks.find((task) => task.id === current.id) ?? current)
            : current,
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [sprintId],
  );

  useEffect(() => {
    if (!sprintId) return;
    void refreshBoard();
  }, [refreshBoard, sprintId]);

  const handleMoveNext = async (task: Task) => {
    const nextMap: Partial<Record<TaskStatus, TaskStatus>> = {
      ToDo: "InProgress",
      InProgress: "Review",
      Review: "Done",
    };
    const next = nextMap[task.status];
    if (!next) return;
    const tasksSnapshot = tasks;
    const orderSnapshot = taskOrder;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
    setTaskOrder((prev) => ({
      ...prev,
      [task.status]: prev[task.status].filter((id) => id !== task.id),
      [next]: [task.id, ...prev[next]],
    }));
    try {
      await tasksApi.update(task.id, { status: next });
      await refreshBoard(false);
    } catch {
      setTasks(tasksSnapshot);
      setTaskOrder(orderSnapshot);
    }
  };

  const handleTaskCreated = (task: Task) => {
    const enrichedTask = {
      ...task,
      sprint: sprint ?? undefined,
      project: sprint?.project,
    };
    setTasks((prev) => [enrichedTask, ...prev]);
    setTaskOrder((prev) => ({
      ...prev,
      [task.status]: [task.id, ...prev[task.status]],
    }));
    void refreshBoard(false);
  };

  const handleSubtasksCreated = async (subtasks: Task[]) => {
    const enrichedSubtasks = subtasks.map((task) => ({
      ...task,
      sprint: sprint ?? undefined,
      project: sprint?.project,
    }));
    setTasks((prev) => [...prev, ...enrichedSubtasks]);
    setTaskOrder((prev) => {
      const next = { ...prev };
      enrichedSubtasks.forEach((task) => {
        next[task.status] = [...next[task.status], task.id];
      });
      return next;
    });
    await refreshBoard(false);
    setAiTask(null);
  };

  const handleTaskUpdated = async (updated: Task) => {
    setTasks((prev) => {
      const nextTasks = prev.map((task) =>
        task.id === updated.id
          ? {
              ...updated,
              sprint: updated.sprint ?? task.sprint ?? sprint ?? undefined,
              project: updated.project ?? task.project ?? sprint?.project,
            }
          : task,
      );
      setTaskOrder(buildTaskOrder(nextTasks));
      return nextTasks;
    });
    setSelectedTask((current) =>
      current?.id === updated.id
        ? {
            ...updated,
            sprint: updated.sprint ?? sprint ?? undefined,
            project: updated.project ?? sprint?.project,
          }
        : current,
    );
    await refreshBoard(false);
  };

  const handleTaskDeleted = async (taskId: string) => {
    setTasks((prev) => {
      const nextTasks = prev.filter((task) => task.id !== taskId);
      setTaskOrder(buildTaskOrder(nextTasks));
      return nextTasks;
    });
    setSelectedTask(null);
    await refreshBoard(false);
  };

  const orderedTasksByStatus = (status: TaskStatus) =>
    taskOrder[status]
      .map((id) => tasksById[id])
      .filter((task): task is Task => Boolean(task));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const findContainer = (id: string) =>
    getColumnId(id) ?? taskStatusById[id] ?? null;

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canUpdateStatus) {
      setActiveTaskId(null);
      return;
    }
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeStatus = findContainer(activeId);
    const overStatus = findContainer(overId);

    if (!activeStatus || !overStatus) return;

    if (activeStatus === overStatus) {
      if (activeId === overId) return;
      setTaskOrder((prev) => {
        const activeIndex = prev[activeStatus].indexOf(activeId);
        const overIndex = prev[activeStatus].indexOf(overId);
        if (activeIndex === -1) return prev;
        const targetIndex =
          overIndex === -1 ? prev[activeStatus].length - 1 : overIndex;
        return {
          ...prev,
          [activeStatus]: arrayMove(
            prev[activeStatus],
            activeIndex,
            targetIndex,
          ),
        };
      });
      return;
    }

    const tasksSnapshot = tasks;
    const orderSnapshot = taskOrder;

    setTaskOrder((prev) => {
      const from = prev[activeStatus].filter((id) => id !== activeId);
      const to = [...prev[overStatus]];
      const overIndex = to.indexOf(overId);
      if (overIndex === -1) {
        to.push(activeId);
      } else {
        to.splice(overIndex, 0, activeId);
      }
      return {
        ...prev,
        [activeStatus]: from,
        [overStatus]: to,
      };
    });

    setTasks((prev) =>
      prev.map((task) =>
        task.id === activeId ? { ...task, status: overStatus } : task,
      ),
    );

    try {
      await tasksApi.update(activeId, { status: overStatus });
      await refreshBoard(false);
    } catch {
      setTasks(tasksSnapshot);
      setTaskOrder(orderSnapshot);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface-app">
      {/* Header */}
      <div className="border-b border-outline-soft bg-surface-lowest px-8 py-5">
        <button
          onClick={() => {
            void navigate(`/projects/${sprint?.projectId}/sprints`);
          }}
          className="mb-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <ChevronLeft size={15} />
          Back to Sprints
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 text-on-surface">
              {sprint?.name ?? "Board"}
            </h1>
            {sprint && (
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
              </p>
            )}
          </div>
          {canCreateTask && sprint && (
            <Button
              id="create-task-btn"
              variant="primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveTaskId(String(active.id))}
          onDragCancel={() => setActiveTaskId(null)}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <div className="flex flex-1 gap-4 overflow-x-auto p-6">
            {COLUMNS.map(({ status, label, accent }) => (
              <BoardColumn
                key={status}
                status={status}
                label={label}
                accent={accent}
                taskIds={taskOrder[status]}
                tasks={orderedTasksByStatus(status)}
                canUpdateStatus={canUpdateStatus}
                canUseAi={canUseAi}
                onMoveNext={handleMoveNext}
                onAiBreakdown={(task) => setAiTask(task)}
                onOpenTask={(task) => setSelectedTask(task)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTaskId && tasksById[activeTaskId] ? (
              <div className="w-[288px]">
                <TaskCard
                  task={tasksById[activeTaskId]}
                  canUpdateStatus={false}
                  canUseAi={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create Task Modal */}
      {sprint && (
        <CreateTaskModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          projectId={sprint.projectId}
          sprintId={sprint.id}
          onCreated={handleTaskCreated}
        />
      )}

      {/* AI Breakdown Modal */}
      {aiTask && (
        <AiBreakdownModal
          open={!!aiTask}
          onClose={() => setAiTask(null)}
          task={aiTask}
          onSubtasksCreated={handleSubtasksCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          task={selectedTask}
          sprint={sprint}
          project={sprint?.project}
          canUpdateStatus={canUpdateStatus}
          canUseAi={canUseAi}
          canDelete={canCreateTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          onAiBreakdown={(task) => {
            setSelectedTask(null);
            setAiTask(task);
          }}
        />
      )}
    </div>
  );
};
