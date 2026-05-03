import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarRange,
  ArrowRight,
  ChevronLeft,
  Activity,
  Gauge,
  AlertTriangle,
  Users,
  Timer,
  MoreVertical,
} from "lucide-react";
import { sprintsApi } from "@/api/sprints";
import { projectsApi } from "@/api/projects";
import type { Sprint, Project, Task } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

interface SprintMetrics {
  tasks: Task[];
  totalTasks: number;
  doneTasks: number;
  committedStoryPoints: number;
  completedStoryPoints: number;
  reviewTasks: number;
  staleReviewTasks: number;
  unassignedTasks: number;
}

const emptyMetrics: SprintMetrics = {
  tasks: [],
  totalTasks: 0,
  doneTasks: 0,
  committedStoryPoints: 0,
  completedStoryPoints: 0,
  reviewTasks: 0,
  staleReviewTasks: 0,
  unassignedTasks: 0,
};

const isStaleReviewTask = (task: Task) => {
  if (task.status !== "Review" || !task.prUrl || !task.statusUpdatedAt)
    return false;
  const ageHours =
    (Date.now() - new Date(task.statusUpdatedAt).getTime()) / (1000 * 60 * 60);
  return ageHours > 48;
};

const buildSprintMetrics = (tasks: Task[]): SprintMetrics =>
  tasks.reduce<SprintMetrics>(
    (metrics, task) => {
      const points = task.storyPoints ?? 0;
      metrics.tasks.push(task);
      metrics.totalTasks += 1;
      metrics.committedStoryPoints += points;
      if (task.status === "Done") {
        metrics.doneTasks += 1;
        metrics.completedStoryPoints += points;
      }
      if (task.status === "Review") metrics.reviewTasks += 1;
      if (isStaleReviewTask(task)) metrics.staleReviewTasks += 1;
      if (!task.assigneeId) metrics.unassignedTasks += 1;
      return metrics;
    },
    { ...emptyMetrics, tasks: [] },
  );

export const SprintsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasPermission("create:sprint");

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [metricsBySprint, setMetricsBySprint] = useState<
    Record<string, SprintMetrics>
  >({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    void Promise.all([projectsApi.getById(projectId), sprintsApi.list()])
      .then(async ([proj, allSprints]) => {
        const projectSprints = allSprints.filter(
          (s) => s.projectId === projectId,
        );
        const metricsEntries = await Promise.all(
          projectSprints.map(async (sprint) => {
            const tasks = await sprintsApi.getTasks(sprint.id);
            return [sprint.id, buildSprintMetrics(tasks)] as const;
          }),
        );
        setProject(proj);
        setSprints(projectSprints);
        setMetricsBySprint(Object.fromEntries(metricsEntries));
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      const sprint = await sprintsApi.create({
        name,
        startDate,
        endDate,
        projectId: projectId!,
      });
      setSprints((prev) => [...prev, sprint]);
      setMetricsBySprint((prev) => ({ ...prev, [sprint.id]: emptyMetrics }));
      setModalOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "Failed to create sprint.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const now = useMemo(() => new Date(), []);
  const activeSprint = sprints.find((s) => {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    const current = now.getTime();
    return current >= start && current <= end;
  });

  const activeSprintMetrics = activeSprint
    ? (metricsBySprint[activeSprint.id] ?? emptyMetrics)
    : emptyMetrics;

  const sprintCompletion =
    activeSprintMetrics.committedStoryPoints > 0
      ? Math.round(
          (activeSprintMetrics.completedStoryPoints /
            activeSprintMetrics.committedStoryPoints) *
            100,
        )
      : activeSprintMetrics.totalTasks > 0
        ? Math.round(
            (activeSprintMetrics.doneTasks / activeSprintMetrics.totalTasks) *
              100,
          )
        : 0;

  const daysRemaining = activeSprint
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeSprint.endDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const totalSprints = sprints.length;
  const allTasks = Object.values(metricsBySprint).flatMap(
    (metrics) => metrics.tasks,
  );
  const committedStoryPoints = Object.values(metricsBySprint).reduce(
    (sum, metrics) => sum + metrics.committedStoryPoints,
    0,
  );
  const completedStoryPoints = Object.values(metricsBySprint).reduce(
    (sum, metrics) => sum + metrics.completedStoryPoints,
    0,
  );
  const totalTasks = Object.values(metricsBySprint).reduce(
    (sum, metrics) => sum + metrics.totalTasks,
    0,
  );
  const unassignedTasks = Object.values(metricsBySprint).reduce(
    (sum, metrics) => sum + metrics.unassignedTasks,
    0,
  );
  const staleReviewTasks = Object.values(metricsBySprint).reduce(
    (sum, metrics) => sum + metrics.staleReviewTasks,
    0,
  );
  const overdueOpenSprints = sprints.filter((s) => {
    const metrics = metricsBySprint[s.id] ?? emptyMetrics;
    return (
      new Date(s.endDate).getTime() < now.getTime() &&
      metrics.doneTasks < metrics.totalTasks
    );
  }).length;
  const capacity =
    totalTasks === 0
      ? 0
      : Math.round(((totalTasks - unassignedTasks) / totalTasks) * 100);

  const recentTasks = [...allTasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.statusUpdatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.statusUpdatedAt ?? a.createdAt).getTime(),
    )
    .slice(0, 3);

  const getSprintStatus = (sprint: Sprint) => {
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    const current = now.getTime();
    if (current < start) return "Upcoming";
    if (current > end) return "Closed";
    return "Active";
  };

  const getRiskLabel = (sprint: Sprint) => {
    const metrics = metricsBySprint[sprint.id] ?? emptyMetrics;
    const end = new Date(sprint.endDate).getTime();
    const remaining = Math.ceil((end - now.getTime()) / (1000 * 60 * 60 * 24));
    if (
      metrics.staleReviewTasks > 0 ||
      (remaining <= 2 && metrics.doneTasks < metrics.totalTasks)
    ) {
      return "Critical";
    }
    if (
      metrics.unassignedTasks > 0 ||
      (remaining <= 5 && metrics.doneTasks < metrics.totalTasks)
    ) {
      return "At Risk";
    }
    return "On Track";
  };

  const getCompletionRate = (metrics: SprintMetrics) =>
    metrics.committedStoryPoints > 0
      ? Math.round(
          (metrics.completedStoryPoints / metrics.committedStoryPoints) * 100,
        )
      : metrics.totalTasks > 0
        ? Math.round((metrics.doneTasks / metrics.totalTasks) * 100)
        : 0;

  return (
    <div className="app-page">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => {
              void navigate("/projects");
            }}
            className="mb-3 flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <ChevronLeft size={14} />
            Projects
          </button>
          {project && (
            <span className="text-label-caps text-on-surface-variant">
              {project.keyTemplate}
            </span>
          )}
          <h1 className="mt-2 text-h1 text-on-surface">Sprint Overview</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Monitor performance, capacity, and risk across{" "}
            {project?.name ?? "this project"}.
          </p>
        </div>
        {canCreate && (
          <Button
            id="create-sprint-btn"
            variant="primary"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={16} />
            New Sprint
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="app-section p-4">
            <div className="flex items-start justify-between">
              <p className="text-label-caps text-on-surface-variant">
                Sprint Completion
              </p>
              <Activity size={18} className="text-blue-600" />
            </div>
            <h2 className="mt-3 text-[28px] font-semibold leading-none text-on-surface">
              {sprintCompletion}%
            </h2>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${sprintCompletion}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {activeSprint && daysRemaining !== null
                ? `${activeSprintMetrics.completedStoryPoints}/${activeSprintMetrics.committedStoryPoints} SP done, ${daysRemaining} days remaining`
                : "No active sprint"}
            </p>
          </div>

          <div className="app-section p-4">
            <div className="flex items-start justify-between">
              <p className="text-label-caps text-on-surface-variant">
                Velocity
              </p>
              <Gauge size={18} className="text-slate-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <h2 className="text-[28px] font-semibold leading-none text-on-surface">
                {completedStoryPoints}
              </h2>
              <span className="text-sm text-slate-400">
                / {committedStoryPoints} SP
              </span>
            </div>
            <p className="mt-3 text-xs text-emerald-600 font-semibold">
              {committedStoryPoints === 0
                ? "No story points estimated yet"
                : `${Math.round((completedStoryPoints / committedStoryPoints) * 100)}% of estimated effort complete`}
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-label-caps text-red-600">
                Delivery Risk Counter
              </p>
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <h2 className="mt-3 text-[28px] font-semibold leading-none text-red-600">
              {staleReviewTasks + overdueOpenSprints}
            </h2>
            <p className="mt-3 text-xs text-red-600 font-semibold">
              {staleReviewTasks} stale reviews, {overdueOpenSprints} overdue
              sprints
            </p>
          </div>

          <div className="app-section p-4">
            <div className="flex items-start justify-between">
              <p className="text-label-caps text-on-surface-variant">
                Team Capacity
              </p>
              <Users size={18} className="text-slate-400" />
            </div>
            <h2 className="mt-3 text-[28px] font-semibold leading-none text-on-surface">
              {capacity}%
            </h2>
            <p className="mt-3 text-xs text-slate-500">
              {totalTasks === 0
                ? "No tasks assigned yet"
                : `${totalTasks - unassignedTasks}/${totalTasks} tasks assigned`}
            </p>
          </div>
        </div>

        {/* Risk table */}
        <div className="app-section overflow-hidden">
          <div className="flex items-center justify-between app-section-header">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Sprint Risk Sentinel
              </h3>
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:underline">
              View all sprints
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3">Sprint</th>
                  <th className="px-6 py-3">Date Range</th>
                  <th className="px-6 py-3">Remaining</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Risk</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6" colSpan={6}>
                      <div className="flex items-center justify-center">
                        <Spinner size="md" />
                      </div>
                    </td>
                  </tr>
                ) : sprints.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-slate-500"
                      colSpan={6}
                    >
                      No sprints to display yet.
                    </td>
                  </tr>
                ) : (
                  sprints.slice(0, 4).map((sprint, index) => {
                    const status = getSprintStatus(sprint);
                    const risk = getRiskLabel(sprint);
                    const metrics = metricsBySprint[sprint.id] ?? emptyMetrics;
                    const remainingDays = Math.max(
                      0,
                      Math.ceil(
                        (new Date(sprint.endDate).getTime() - now.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    );
                    return (
                      <tr
                        key={sprint.id}
                        className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}
                      >
                        <td className="px-6 py-4 font-semibold text-blue-600">
                          {sprint.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(sprint.startDate)} —{" "}
                          {formatDate(sprint.endDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 font-semibold text-red-600">
                            <Timer size={14} />
                            {status === "Closed"
                              ? "Closed"
                              : `${remainingDays}d`}
                          </span>
                          <p className="mt-1 text-xs text-slate-400">
                            {metrics.doneTasks}/{metrics.totalTasks} tasks done
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              risk === "Critical"
                                ? "bg-red-100 text-red-600"
                                : risk === "At Risk"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700",
                            ].join(" ")}
                          >
                            {risk}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="rounded p-1 text-slate-500 hover:bg-slate-200"
                            onClick={() => {
                              void navigate(`/sprints/${sprint.id}/board`);
                            }}
                            title="Open sprint board"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="app-section p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Sprint Progress
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Completion
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Stale Reviews
                </span>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {sprints.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No sprint progress to show yet.
                </p>
              ) : (
                sprints.slice(0, 6).map((sprint) => {
                  const metrics = metricsBySprint[sprint.id] ?? emptyMetrics;
                  const completion = getCompletionRate(metrics);
                  return (
                    <div key={sprint.id}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {sprint.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {metrics.completedStoryPoints}/
                            {metrics.committedStoryPoints} SP,{" "}
                            {metrics.doneTasks}/{metrics.totalTasks} tasks
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {completion}%
                          </p>
                          {metrics.staleReviewTasks > 0 && (
                            <p className="text-xs font-semibold text-amber-700">
                              {metrics.staleReviewTasks} stale review
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="app-section p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent Task Updates
            </h3>
            <div className="mt-6 space-y-5 text-sm">
              {recentTasks.length === 0 ? (
                <p className="text-slate-500">No task activity yet.</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex gap-3">
                    <span
                      className={[
                        "mt-1 h-2 w-2 rounded-full",
                        task.status === "Done"
                          ? "bg-emerald-500"
                          : task.status === "Review"
                            ? "bg-amber-500"
                            : "bg-blue-500",
                      ].join(" ")}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{task.key}</p>
                      <p className="text-slate-500">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {task.status === "InProgress"
                          ? "In Progress"
                          : task.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="mt-6 rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-900">
              {totalTasks} live tasks loaded
            </p>
          </div>
        </div>

        {/* Sprints list */}
        <section className="app-section overflow-hidden">
          <div className="app-section-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              All Sprints
            </h3>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {totalSprints} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : sprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-t border-dashed border-outline-soft py-16 text-center">
              <CalendarRange size={48} className="text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                No sprints yet
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {canCreate
                  ? "Create your first sprint to start tracking tasks."
                  : "No sprints have been created yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-soft">
              {sprints.map((sprint) => {
                const metrics = metricsBySprint[sprint.id] ?? emptyMetrics;
                const completion = getCompletionRate(metrics);
                return (
                  <div
                    key={sprint.id}
                    id={`sprint-card-${sprint.id}`}
                    className="group flex items-center justify-between bg-white px-5 py-4 transition-colors duration-150 hover:bg-surface-low"
                    onClick={() => {
                      void navigate(`/sprints/${sprint.id}/board`);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        void navigate(`/sprints/${sprint.id}/board`);
                      }
                    }}
                  >
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {sprint.name}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(sprint.startDate)} —{" "}
                        {formatDate(sprint.endDate)}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {completion}% complete · {metrics.totalTasks} tasks ·{" "}
                        {metrics.completedStoryPoints}/
                        {metrics.committedStoryPoints} SP
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                      Open Board
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError("");
        }}
        title="New Sprint"
      >
        <form
          id="create-sprint-form"
          onSubmit={(event) => {
            void handleCreate(event);
          }}
          className="flex flex-col gap-4"
        >
          <Input
            id="sprint-name"
            label="Sprint Name"
            placeholder="e.g. Sprint 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="sprint-start"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              id="sprint-end"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          {formError && <p className="text-body-sm text-error">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Create Sprint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
