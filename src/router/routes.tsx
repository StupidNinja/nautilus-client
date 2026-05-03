import { type RouteObject, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { SprintsPage } from "@/features/sprints/SprintsPage";
import { BoardPage } from "@/features/board/BoardPage";
import { TeamPage } from "@/features/team/TeamPage";

export const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "team", element: <TeamPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "projects/:projectId/sprints", element: <SprintsPage /> },
      { path: "sprints/:sprintId/board", element: <BoardPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
];
