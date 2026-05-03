import { useState } from "react";
import { Sparkles, CheckCircle2, Plus } from "lucide-react";
import { tasksApi } from "@/api/tasks";
import type { Task, AiSubtaskSuggestion } from "@/api/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AiBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  onSubtasksCreated: (subtasks: Task[]) => void | Promise<void>;
}

export const AiBreakdownModal = ({
  open,
  onClose,
  task,
  onSubtasksCreated,
}: AiBreakdownModalProps) => {
  const [suggestions, setSuggestions] = useState<AiSubtaskSuggestion[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "suggestions" | "done">("idle");

  const handleGenerate = async () => {
    setError("");
    setLoadingBreakdown(true);
    try {
      const result = await tasksApi.aiBreakdown(task.id);
      setSuggestions(result);
      setStep("suggestions");
    } catch {
      setError(
        "Could not generate AI breakdown. Check your GEMINI_API_KEY and try again.",
      );
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleAccept = async () => {
    setError("");
    setLoadingAccept(true);
    try {
      const created = await tasksApi.acceptSubtasks(task.id, suggestions);
      await onSubtasksCreated(created);
      setStep("done");
      setTimeout(() => {
        onClose();
        setStep("idle");
        setSuggestions([]);
      }, 1500);
    } catch {
      setError("Failed to save subtasks. Please try again.");
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep("idle");
    setSuggestions([]);
    setError("");
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI Task Breakdown"
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {/* Parent task info */}
        <div className="rounded border border-outline-variant bg-surface-low px-4 py-3">
          <p className="text-label-caps text-on-surface-variant mb-1">
            Parent Task
          </p>
          <div className="flex items-center gap-2">
            <span className="text-data-mono text-on-surface-variant">
              {task.key}
            </span>
            <span className="text-body-md font-semibold text-on-surface">
              {task.title}
            </span>
          </div>
        </div>

        {step === "idle" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed">
              <Sparkles size={26} className="text-primary" />
            </div>
            <div>
              <h3 className="text-h3 text-on-surface">
                Generate Subtasks with AI
              </h3>
              <p className="mt-1 text-body-md text-on-surface-variant max-w-sm mx-auto">
                Gemini will analyze this task and suggest 3–4 actionable
                subtasks. You can review and accept them before saving.
              </p>
            </div>
            <Button
              id="ai-generate-btn"
              variant="primary"
              onClick={() => {
                void handleGenerate();
              }}
              loading={loadingBreakdown}
              className="gap-2"
            >
              <Sparkles size={15} />
              Generate Breakdown
            </Button>
            {error && <p className="text-body-sm text-error">{error}</p>}
          </div>
        )}

        {step === "suggestions" && (
          <div className="flex flex-col gap-3">
            <p className="text-body-md text-on-surface-variant">
              Review the suggested subtasks below. Click{" "}
              <strong>Accept &amp; Create</strong> to save them.
            </p>
            <div className="flex flex-col gap-2.5">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="rounded border border-outline-variant bg-surface-lowest px-4 py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <Plus size={15} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-body-md font-semibold text-on-surface">
                        {s.title}
                      </p>
                      {s.description && (
                        <p className="mt-0.5 text-body-sm text-on-surface-variant">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="text-body-sm text-error">{error}</p>}
            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  void handleGenerate();
                }}
                loading={loadingBreakdown}
              >
                Regenerate
              </Button>
              <Button
                id="ai-accept-btn"
                variant="primary"
                onClick={() => {
                  void handleAccept();
                }}
                loading={loadingAccept}
                className="gap-2"
              >
                <CheckCircle2 size={15} />
                Accept &amp; Create
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={40} className="text-[#16a34a]" />
            <p className="text-h3 text-on-surface">Subtasks created!</p>
            <p className="text-body-md text-on-surface-variant">
              The board has been updated.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
