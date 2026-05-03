import { apiClient } from "./client";
import type { Project, ProjectJoinCode, ProjectMember } from "./types";

export const projectsApi = {
  create: async (name: string, keyTemplate: string): Promise<Project> => {
    const { data } = await apiClient.post<Project>("/projects", {
      name,
      keyTemplate,
    });
    return data;
  },

  list: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>("/projects");
    return data;
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<Project>(`/projects/${id}`);
    return data;
  },

  listMembers: async (id: string): Promise<ProjectMember[]> => {
    const { data } = await apiClient.get<ProjectMember[]>(
      `/projects/${id}/members`,
    );
    return data;
  },

  addMember: async (id: string, userId: string): Promise<ProjectMember> => {
    const { data } = await apiClient.post<ProjectMember>(
      `/projects/${id}/members`,
      { userId },
    );
    return data;
  },

  removeMember: async (
    id: string,
    userId: string,
  ): Promise<{ removed: boolean }> => {
    const { data } = await apiClient.delete<{ removed: boolean }>(
      `/projects/${id}/members/${userId}`,
    );
    return data;
  },

  joinByCode: async (code: string): Promise<ProjectMember> => {
    const { data } = await apiClient.post<ProjectMember>("/projects/join", {
      code,
    });
    return data;
  },

  getJoinCode: async (id: string): Promise<ProjectJoinCode> => {
    const { data } = await apiClient.get<ProjectJoinCode>(
      `/projects/${id}/join-code`,
    );
    return data;
  },

  regenerateJoinCode: async (id: string): Promise<ProjectJoinCode> => {
    const { data } = await apiClient.post<ProjectJoinCode>(
      `/projects/${id}/join-code/regenerate`,
    );
    return data;
  },
};
