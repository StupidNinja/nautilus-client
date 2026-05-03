import { apiClient } from "./client";
import type { Sprint, Task } from "./types";

export const sprintsApi = {
  create: async (payload: {
    name: string;
    startDate: string;
    endDate: string;
    projectId: string;
  }): Promise<Sprint> => {
    const { data } = await apiClient.post<Sprint>("/sprints", payload);
    return data;
  },

  list: async (): Promise<Sprint[]> => {
    const { data } = await apiClient.get<Sprint[]>("/sprints");
    return data;
  },

  getById: async (id: string): Promise<Sprint> => {
    const { data } = await apiClient.get<Sprint>(`/sprints/${id}`);
    return data;
  },

  getTasks: async (sprintId: string): Promise<Task[]> => {
    const { data } = await apiClient.get<Task[]>(`/sprints/${sprintId}/tasks`);
    return data;
  },
};
