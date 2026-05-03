import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { projectsApi } from "@/api/projects";
import { usersApi } from "@/api/users";
import type {
  Project,
  ProjectJoinCode,
  ProjectMember,
  User,
} from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

const getErrorMessage = (err: unknown, fallback: string) => {
  const message = (
    err as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;
  return fallback;
};

export const TeamPage = () => {
  const { user, hasPermission } = useAuth();
  const canManageTeam =
    hasPermission("manage:users") || hasPermission("create:project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [joinCode, setJoinCode] = useState<ProjectJoinCode | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [adding, setAdding] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const showTeamPanel = canManageTeam || projects.length > 0;

  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.userId));
    return users.filter((candidate) => !memberIds.has(candidate.id));
  }, [members, users]);

  const loadProjects = async () => {
    const data = await projectsApi.list();
    setProjects(data);
    setSelectedProjectId((current) => current || data[0]?.id || "");
  };

  useEffect(() => {
    void Promise.all([
      loadProjects(),
      canManageTeam ? usersApi.list().then(setUsers) : Promise.resolve(),
    ])
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load team data.")),
      )
      .finally(() => setLoading(false));
  }, [canManageTeam]);

  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([]);
      setJoinCode(null);
      return;
    }

    setMembersLoading(true);
    setError("");

    void Promise.all([
      projectsApi.listMembers(selectedProjectId).then(setMembers),
      canManageTeam
        ? projectsApi.getJoinCode(selectedProjectId).then(setJoinCode)
        : Promise.resolve(),
    ])
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load project members.")),
      )
      .finally(() => setMembersLoading(false));
  }, [canManageTeam, selectedProjectId]);

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setJoining(true);

    try {
      const member = await projectsApi.joinByCode(joinInput);
      setJoinInput("");
      setMessage("Joined project successfully.");
      await loadProjects();
      setSelectedProjectId(member.projectId);
      const refreshed = await projectsApi.listMembers(member.projectId);
      setMembers(refreshed);
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not join project with this pass code."),
      );
    } finally {
      setJoining(false);
    }
  };

  const handleCopyCode = async () => {
    if (!joinCode?.code) return;
    await navigator.clipboard.writeText(joinCode.code);
    setMessage("Project pass code copied.");
  };

  const handleRegenerateCode = async () => {
    if (!selectedProjectId) return;
    setRegenerating(true);
    setError("");
    setMessage("");

    try {
      const nextCode = await projectsApi.regenerateJoinCode(selectedProjectId);
      setJoinCode(nextCode);
      setMessage("Project pass code regenerated.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to regenerate pass code."));
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !selectedUserId) return;

    setAdding(true);
    setError("");
    setMessage("");

    try {
      const member = await projectsApi.addMember(
        selectedProjectId,
        selectedUserId,
      );
      setMembers((prev) => [
        ...prev.filter((item) => item.userId !== member.userId),
        member,
      ]);
      setSelectedUserId("");
      setMessage("User assigned to project.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to assign user to project."));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!selectedProjectId || member.userId === user?.id) return;

    setError("");
    setMessage("");

    try {
      await projectsApi.removeMember(selectedProjectId, member.userId);
      setMembers((prev) =>
        prev.filter((item) => item.userId !== member.userId),
      );
      setMessage("User removed from project.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove user from project."));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="app-page">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-h1 text-on-surface">Team Management</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Assign people to projects and onboard new users with project pass
            codes.
          </p>
        </div>
        <Badge variant={canManageTeam ? "warning" : "default"}>
          {canManageTeam ? "Manager access" : "Join access"}
        </Badge>
      </header>

      {(message || error) && (
        <div
          className={[
            "mb-5 rounded-lg border px-4 py-3 text-body-sm",
            error
              ? "border-error-container bg-error-container/30 text-on-error-container"
              : "border-success-bg bg-success-bg text-success",
          ].join(" ")}
        >
          {error || message}
        </div>
      )}

      <div
        className={
          showTeamPanel
            ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
            : "max-w-[460px]"
        }
      >
        {showTeamPanel && (
          <section className="app-section overflow-hidden">
            <div className="app-section-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-h3 text-on-surface">Project Team</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {canManageTeam
                    ? "Current members for the selected delivery space."
                    : "Members of projects you have joined."}
                </p>
              </div>
              <select
                className="min-w-[240px] rounded-md border border-outline-soft bg-surface-lowest px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                {projects.length === 0 ? (
                  <option value="">No projects</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {membersLoading ? (
              <div className="flex justify-center py-20">
                <Spinner size="md" />
              </div>
            ) : !selectedProject ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <Users size={42} className="mb-3 text-outline" />
                <h3 className="text-h3 text-on-surface">No project selected</h3>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {canManageTeam
                    ? "Create a project first, then invite teammates with its pass code."
                    : "Enter a project pass code to join a team."}
                </p>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <Users size={42} className="mb-3 text-outline" />
                <h3 className="text-h3 text-on-surface">No members yet</h3>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Add existing users or share the pass code with new teammates.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-soft">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-body-sm font-semibold text-primary">
                        {member.user?.email?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-body-md font-semibold text-on-surface">
                            {member.user?.email ?? member.userId}
                          </span>
                          {member.userId === user?.id && <Badge>You</Badge>}
                        </div>
                        <p className="mt-1 text-body-sm text-on-surface-variant">
                          Joined{" "}
                          {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManageTeam && member.userId !== user?.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void handleRemoveMember(member);
                        }}
                      >
                        <UserMinus size={15} />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <aside className="flex flex-col gap-5">
          <section className="app-section p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                <KeyRound size={17} />
              </div>
              <div>
                <h2 className="text-h3 text-on-surface">Join Project</h2>
                <p className="text-body-sm text-on-surface-variant">
                  Enter a manager-provided pass code.
                </p>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                void handleJoin(event);
              }}
              className="flex flex-col gap-3"
            >
              <Input
                id="join-project-code"
                label="Pass Code"
                placeholder="NAU-AB12CD"
                value={joinInput}
                onChange={(event) =>
                  setJoinInput(event.target.value.toUpperCase())
                }
              />
              <Button
                type="submit"
                loading={joining}
                disabled={!joinInput.trim()}
              >
                <UserPlus size={16} />
                Join Project
              </Button>
            </form>
          </section>

          {canManageTeam && selectedProject && (
            <>
              <section className="app-section p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                    <ShieldCheck size={17} />
                  </div>
                  <div>
                    <h2 className="text-h3 text-on-surface">
                      Project Pass Code
                    </h2>
                    <p className="text-body-sm text-on-surface-variant">
                      Share with new users to join {selectedProject.name}.
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-outline-soft bg-surface-low px-4 py-3">
                  <p className="text-label-caps text-on-surface-variant">
                    Current code
                  </p>
                  <p className="mt-1 break-all text-xl font-semibold tracking-wide text-on-surface">
                    {joinCode?.code ?? "Generating..."}
                  </p>
                  {joinCode?.updatedAt && (
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      Updated {new Date(joinCode.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      void handleCopyCode();
                    }}
                    disabled={!joinCode?.code}
                  >
                    <Copy size={15} />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={regenerating}
                    onClick={() => {
                      void handleRegenerateCode();
                    }}
                  >
                    <RefreshCw size={15} />
                    Reset
                  </Button>
                </div>
              </section>

              <section className="app-section p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <UserPlus size={17} />
                  </div>
                  <div>
                    <h2 className="text-h3 text-on-surface">
                      Assign Existing User
                    </h2>
                    <p className="text-body-sm text-on-surface-variant">
                      Add an account that already exists in Nautilus.
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={(event) => {
                    void handleAddMember(event);
                  }}
                  className="flex flex-col gap-3"
                >
                  <select
                    className="rounded-md border border-outline-soft bg-surface-lowest px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                  >
                    <option value="">
                      {availableUsers.length
                        ? "Select user"
                        : "All users assigned"}
                    </option>
                    {availableUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    loading={adding}
                    disabled={!selectedUserId || !availableUsers.length}
                  >
                    <UserPlus size={16} />
                    Assign User
                  </Button>
                </form>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
