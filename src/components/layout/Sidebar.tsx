import { NavLink, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NautilusLogo } from "@/components/brand/NautilusLogo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/team", label: "Team", icon: Users },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    void logout();
    void navigate("/login");
  };

  return (
    <aside
      className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10"
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-4 px-5 py-5 border-b border-white/10">
        <NautilusLogo compact />
        <div>
          <span className="block text-h3 text-white font-semibold tracking-tight">
            Nautilus
          </span>
          <span className="text-[11px] font-medium text-sidebar-text">
            Delivery OS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1 p-3 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-colors duration-150",
                isActive
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : "text-sidebar-text hover:bg-white/10 hover:text-white",
              ].join(" ")
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div
        className="border-t border-white/10 px-4 py-4"
        style={{ backgroundColor: "var(--color-sidebar-item)" }}
      >
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <button
            onClick={() => {
              void navigate("/profile");
            }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-white/10"
            title="Open profile"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-body-sm font-semibold shrink-0">
              {user?.email?.charAt(0).toUpperCase() ?? <UserRound size={15} />}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-body-sm text-white font-medium truncate">
                {user?.email?.split("@")[0]}
              </span>
              <span className="text-[11px] text-sidebar-text truncate">
                {user?.email}
              </span>
            </div>
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded p-1.5 text-sidebar-text hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
