import { apiClient } from "./client";
import type { User } from "./types";

export const usersApi = {
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  },

  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>("/users");
    return data;
  },

  updatePermissions: async (
    id: string,
    permissions: string[],
  ): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${id}/permissions`, {
      permissions,
    });
    return data;
  },
};
