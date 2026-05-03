import { LogOut, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";

const permissionLabels: Record<string, string> = {
  "create:project": "Create projects",
  "create:sprint": "Create sprints",
  "create:task": "Create tasks",
  "update:task_status": "Update task status",
  "update:pr_url": "Update PR links",
  "view:users": "View users",
  "manage:users": "Manage users",
  "use:ai": "Use AI breakdown",
};

const getRole = (permissions: string[]) => {
  if (
    permissions.includes("manage:users") ||
    permissions.includes("create:project")
  ) {
    return "Manager";
  }
  if (permissions.includes("update:task_status")) {
    return "Developer";
  }
  return "Viewer";
};

const formatDate = (value?: string) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const permissions = user?.permissions ?? [];
  const role = getRole(permissions);
  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  const handleLogout = () => {
    void logout();
    void navigate("/login");
  };

  return (
    <div className="app-page">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-on-surface">Profile</h1>
          <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
            Account identity, role, and permissions for the current Nautilus
            session.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={15} />
            Refresh
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <section className="app-section p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-[32px] font-semibold text-white shadow-sm">
              {initials}
            </div>
            <h2 className="mt-4 text-h2 text-on-surface">
              {user?.email?.split("@")[0] ?? "User"}
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {user?.email}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="default">{role}</Badge>
              <Badge
                variant={permissions.includes("use:ai") ? "risk" : "default"}
                risk="Low"
              >
                {permissions.includes("use:ai") ? "AI enabled" : "AI disabled"}
              </Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-outline-soft pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-body-sm text-on-surface-variant">
                Created
              </span>
              <span className="text-body-sm font-semibold text-on-surface">
                {formatDate(user?.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-body-sm text-on-surface-variant">
                Updated
              </span>
              <span className="text-body-sm font-semibold text-on-surface">
                {formatDate(user?.updatedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-body-sm text-on-surface-variant">
                Permissions
              </span>
              <span className="text-body-sm font-semibold text-on-surface">
                {permissions.length}
              </span>
            </div>
          </div>
        </section>

        <section className="app-section overflow-hidden">
          <div className="app-section-header flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-on-surface">Access Rights</h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Capabilities currently attached to your account.
              </p>
            </div>
            <ShieldCheck size={20} className="text-primary" />
          </div>

          {permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <UserRound size={40} className="text-outline" />
              <h3 className="mt-3 text-h3 text-on-surface">Viewer access</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">
                This account does not have elevated project or task permissions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-soft">
              {permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="text-body-md font-semibold text-on-surface">
                      {permissionLabels[permission] ?? permission}
                    </p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      {permission}
                    </p>
                  </div>
                  <Badge variant="default">Allowed</Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
