import { apiClient } from "./client";
import type { Task, TaskStatus, AiSubtaskSuggestion } from "./types";

export const tasksApi = {
  create: async (payload: {
    title: string;
    description?: string;
    projectId: string;
    sprintId?: string;
    assigneeId?: string;
    storyPoints?: number;
    priority?: string;
  }): Promise<Task> => {
    const { data } = await apiClient.post<Task>("/tasks", payload);
    return data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  update: async (
    id: string,
    payload: {
      title?: string;
      description?: string;
      assigneeId?: string;
      sprintId?: string;
      status?: TaskStatus;
      prUrl?: string;
      storyPoints?: number;
      priority?: string;
    },
  ): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<{ deleted: true }> => {
    const { data } = await apiClient.delete<{ deleted: true }>(`/tasks/${id}`);
    return data;
  },

  acceptSubtasks: async (
    parentId: string,
    subtasks: AiSubtaskSuggestion[],
  ): Promise<Task[]> => {
    const { data } = await apiClient.post<Task[]>(
      `/tasks/${parentId}/subtasks`,
      { subtasks },
    );
    return data;
  },

  aiBreakdown: async (taskId: string): Promise<AiSubtaskSuggestion[]> => {
    const { data } = await apiClient.post<AiSubtaskSuggestion[]>(
      `/tasks/${taskId}/ai-breakdown`,
    );
    return data;
  },
};
