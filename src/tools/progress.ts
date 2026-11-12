import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { progressTracker } from "../core/progress-tracker.js";
import { budgetController } from "../core/budget-controller.js";
import { disciplineBanner } from "../core/action-guard.js";

export const progressSchema = z.object({
  task_id: z.string(),
  action: z.string().describe("Action that was just performed"),
  result: z.string().describe("Outcome / result of the action"),
});

export type ProgressInput = z.infer<typeof progressSchema>;

export function overthinkCheckProgress(input: ProgressInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  const { repeated, similar, previous } = progressTracker.detectRepetition(
    task,
    input.action
  );
  const { progress, reason } = progressTracker.evaluateProgress(
    task,
    input.action,
    input.result
  );

  taskManager.addAction(input.task_id, {
    action: input.action,
    result: input.result,
    progress,
    repeated: repeated || similar,
    timestamp: new Date().toISOString(),
  });

  const updated = taskManager.get(input.task_id)!;
  const report = progressTracker.getProgressReport(updated);
  const budget = budgetController.summary(updated);
  const fail_loop = progressTracker.isFailLoop(updated);

  let instruction = reason;
  let force_stop = false;

  if (repeated || similar) {
    instruction =
      "OVERTHINK BLOCK: Repeated/similar action. Do NOT run the same family again. Change hypothesis, file, or URL.";
  } else if (!progress) {
    instruction =
      "No useful progress. One different narrower action — or ask the user. Do not expand scope.";
  }

  if (fail_loop || updated.stagnation_count >= 3 || !budget.can_continue) {
    force_stop = true;
    instruction =
      "OVERTHINK HARD STOP: Fail-loop or budget exhausted. Summarize evidence + blockers. No more exploratory commands.";
  }

  return {
    progress,
    repeated,
    similar,
    previous_result: previous?.result,
    stagnation_count: updated.stagnation_count,
    fail_loop,
    force_stop,
    instruction,
    progress_report: report,
    budget,
    discipline: disciplineBanner(),
    next:
      force_stop
        ? "overthink_finish"
        : progress
          ? "overthink_next_action"
          : "overthink_next_action (MUST be a different angle)",
  };
}
