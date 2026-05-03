export interface User {
  id: string;
  email: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  keyTemplate: string;
  taskSequence: number;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface ProjectJoinCode {
  code: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  projectId: string;
  project?: Project;
  createdAt: string;
}

export type TaskStatus = "ToDo" | "InProgress" | "Review" | "Done";

export interface Task {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: TaskStatus;
  prUrl?: string;
  storyPoints?: number;
  priority?: string;
  statusUpdatedAt?: string;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
  parentId?: string;
  assignee?: User;
  sprint?: Sprint;
  project?: Project;
  subtasks?: Task[];
  createdAt: string;
  updatedAt?: string;
}

export interface AiSubtaskSuggestion {
  title: string;
  description: string;
  suggestedStoryPoints?: number;
}

export interface DashboardSummary {
  totalProjects: number;
  activeSprints: number;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  committedStoryPoints: number;
  completedStoryPoints: number;
  staleReviewTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
}
