import { apiClient } from "./client";

export const authApi = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> => {
    const { data } = await apiClient.post<{ accessToken: string }>(
      "/auth/login",
      {
        email,
        password,
      },
    );
    return data;
  },

  register: async (
    email: string,
    password: string,
    projectCode?: string,
  ): Promise<{ accessToken: string }> => {
    const { data } = await apiClient.post<{ accessToken: string }>(
      "/auth/register",
      {
        email,
        password,
        projectCode: projectCode || undefined,
      },
    );
    return data;
  },
};
