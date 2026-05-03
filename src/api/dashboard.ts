import { apiClient } from "./client";
import type { DashboardSummary } from "./types";

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const { data } =
      await apiClient.get<DashboardSummary>("/dashboard/summary");
    return data;
  },
};
