import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { progressTracker } from "../core/progress-tracker.js";
import { verificationEngine } from "../engines/verification.engine.js";

export const finishSchema = z.object({
  task_id: z.string(),
  summary: z.string().optional().describe("Short human summary of what was done"),
});

export type FinishInput = z.infer<typeof finishSchema>;

export function overthinkFinish(input: FinishInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  const report = progressTracker.getProgressReport(task);
  const verification = verificationEngine.evaluate(task.verification_checks);

  const status =
    verification.status === "verified"
      ? "completed"
      : verification.status === "failed"
        ? "failed"
        : "completed"; // allow partial with explicit status

  taskManager.update(input.task_id, { status });

  return {
    task_id: task.task_id,
    objective: task.objective,
    status,
    verification_status: verification.status,
    root_cause: task.suspected_root_cause ?? null,
    confidence: task.confidence,
    relevant_files: task.relevant_files,
    actions_taken: task.actions.length,
    progress_report: report,
    summary:
      input.summary ??
      (task.suspected_root_cause
        ? `Addressed: ${task.suspected_root_cause}`
        : "Task finished. See progress report for details."),
    concise_report: [
      `Objective: ${task.objective}`,
      task.suspected_root_cause
        ? `Root cause: ${task.suspected_root_cause} (confidence ${(task.confidence * 100).toFixed(0)}%)`
        : "Root cause: not fully confirmed",
      `Verification: ${verification.status}`,
      `Actions: ${task.actions.length}`,
    ].join("\n"),
  };
}
