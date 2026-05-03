import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const MainLayout = () => (
  <div className="flex h-screen overflow-hidden bg-surface-app">
    <Sidebar />
    <main className="min-w-0 flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);
