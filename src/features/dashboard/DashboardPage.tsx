import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Gauge,
  GitPullRequest,
  ListTodo,
  Target,
} from "lucide-react";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardSummary, TaskStatus } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

const EMPTY_SUMMARY: DashboardSummary = {
  totalProjects: 0,
  activeSprints: 0,
  totalTasks: 0,
  doneTasks: 0,
  completionRate: 0,
  committedStoryPoints: 0,
  completedStoryPoints: 0,
  staleReviewTasks: 0,
  tasksByStatus: {
    ToDo: 0,
    InProgress: 0,
    Review: 0,
    Done: 0,
  },
};

const MetricCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Activity;
  tone?: "default" | "warning" | "success";
}) => {
  const toneClass =
    tone === "warning"
      ? "border-[#fcd34d] bg-warning-bg"
      : tone === "success"
        ? "border-[#bbf7d0] bg-success-bg"
        : "border-outline-soft bg-surface-lowest";

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-label-caps text-on-surface-variant">{label}</p>
        <div className="rounded-md bg-white/70 p-1.5">
          <Icon size={16} className="text-primary" />
        </div>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none text-on-surface">
        {value}
      </p>
      <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>
    </div>
  );
};

export const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setSummary)
      .catch(() => setError("Dashboard metrics could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const statusEntries = useMemo(
    () => Object.entries(summary.tasksByStatus) as [TaskStatus, number][],
    [summary.tasksByStatus],
  );

  const storyPointRate =
    summary.committedStoryPoints === 0
      ? 0
      : Math.round(
          (summary.completedStoryPoints / summary.committedStoryPoints) * 100,
        );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-on-surface">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
            Live delivery metrics for project transparency, sprint stability,
            and delay-risk monitoring.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Rule-based risk prototype</Badge>
          <Badge variant={summary.staleReviewTasks > 0 ? "warning" : "default"}>
            {summary.staleReviewTasks} stale review PRs
          </Badge>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded border border-error-container bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Projects"
          value={summary.totalProjects}
          hint="Tracked outsourcing initiatives"
          icon={FolderKanban}
        />
        <MetricCard
          label="Active Sprints"
          value={summary.activeSprints}
          hint="Currently open delivery windows"
          icon={Activity}
        />
        <MetricCard
          label="Total Tasks"
          value={summary.totalTasks}
          hint={`${summary.doneTasks} completed tasks`}
          icon={ListTodo}
        />
        <MetricCard
          label="Completion Rate"
          value={`${summary.completionRate}%`}
          hint="Done tasks divided by all tasks"
          icon={CheckCircle2}
          tone={summary.completionRate >= 50 ? "success" : "default"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="app-section">
          <div className="app-section-header flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-on-surface">Tasks by Status</h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Kanban distribution for current delivery work.
              </p>
            </div>
            <Gauge size={20} className="text-primary" />
          </div>
          <div className="space-y-4 p-5">
            {statusEntries.map(([status, count]) => {
              const width =
                summary.totalTasks === 0
                  ? 0
                  : Math.round((count / summary.totalTasks) * 100);
              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="status" status={status} />
                      <span className="text-body-sm text-on-surface-variant">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <span className="text-data-mono text-on-surface">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-base">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="app-section">
          <div className="app-section-header">
            <h2 className="text-h3 text-on-surface">Story Point Velocity</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Committed versus completed effort.
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-label-caps text-on-surface-variant">
                  Completed
                </p>
                <p className="mt-2 text-h1 text-on-surface">
                  {summary.completedStoryPoints}
                </p>
              </div>
              <div className="text-right">
                <p className="text-label-caps text-on-surface-variant">
                  Committed
                </p>
                <p className="mt-2 text-h1 text-on-surface">
                  {summary.committedStoryPoints}
                </p>
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-base">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${storyPointRate}%` }}
              />
            </div>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {storyPointRate}% of committed story points are complete.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard
          label="Stale Review Tasks"
          value={summary.staleReviewTasks}
          hint="Review tasks with PRs inactive for 48+ hours"
          icon={GitPullRequest}
          tone={summary.staleReviewTasks > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="Done Tasks"
          value={summary.doneTasks}
          hint="Completed delivery units"
          icon={Target}
          tone="success"
        />
        <MetricCard
          label="Risk Posture"
          value={summary.staleReviewTasks > 0 ? "Watch" : "Stable"}
          hint="Delay monitoring signal for defense demo"
          icon={AlertTriangle}
          tone={summary.staleReviewTasks > 0 ? "warning" : "success"}
        />
      </div>
    </div>
  );
};
