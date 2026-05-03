import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, ArrowRight, Hash } from "lucide-react";
import { projectsApi } from "@/api/projects";
import type { Project } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

export const ProjectsPage = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasPermission("create:project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [keyTemplate, setKeyTemplate] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void projectsApi
      .list()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      const project = await projectsApi.create(name, keyTemplate.toUpperCase());
      setProjects((prev) => [...prev, project]);
      setModalOpen(false);
      setName("");
      setKeyTemplate("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app-page">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-on-surface">Projects</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage your projects and track their sprints
          </p>
        </div>
        {canCreate && (
          <Button
            id="create-project-btn"
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="gap-2"
          >
            <Plus size={16} />
            New Project
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen size={48} className="text-outline mb-4" />
          <h3 className="text-h3 text-on-surface">No projects yet</h3>
          <p className="text-body-md text-on-surface-variant mt-2">
            {canCreate
              ? "Create your first project to get started."
              : "No projects have been created yet."}
          </p>
        </div>
      ) : (
        <div className="app-section overflow-hidden">
          <div className="app-section-header flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-on-surface">Project Portfolio</h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Active delivery spaces and their task key sequences.
              </p>
            </div>
            <span className="text-label-caps text-on-surface-variant">
              {projects.length} total
            </span>
          </div>
          <div className="divide-y divide-outline-soft">
            {projects.map((project) => (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className="group grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 bg-surface-lowest px-5 py-4 transition-colors duration-150 hover:bg-surface-low"
                onClick={() => {
                  void navigate(`/projects/${project.id}/sprints`);
                }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <Hash size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-body-lg font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {project.name}
                      </h2>
                      <span className="rounded bg-primary-fixed px-2 py-0.5 text-data-mono text-on-primary-fixed-variant">
                        {project.keyTemplate}
                      </span>
                    </div>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      {project.taskSequence} task
                      {project.taskSequence !== 1 ? "s" : ""} created
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-body-sm text-primary font-semibold gap-1">
                  Sprints
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError("");
        }}
        title="New Project"
      >
        <form
          id="create-project-form"
          onSubmit={(event) => {
            void handleCreate(event);
          }}
          className="flex flex-col gap-4"
        >
          <Input
            id="project-name"
            label="Project Name"
            placeholder="e.g. Nautilus MVP"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="project-key"
            label="Key Template"
            placeholder="e.g. NAV"
            value={keyTemplate}
            onChange={(e) => setKeyTemplate(e.target.value.toUpperCase())}
            hint="2–6 uppercase letters. Used to prefix task keys (e.g. NAV-1)."
            maxLength={6}
            required
          />
          {formError && <p className="text-body-sm text-error">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
