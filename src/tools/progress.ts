import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { progressTracker } from "../core/progress-tracker.js";
import { budgetController } from "../core/budget-controller.js";

export const progressSchema = z.object({
  task_id: z.string(),
  action: z.string().describe("Action that was just performed"),
  result: z.string().describe("Outcome / result of the action"),
});

export type ProgressInput = z.infer<typeof progressSchema>;

export function overthinkCheckProgress(input: ProgressInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  const { repeated, previous } = progressTracker.detectRepetition(
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
    repeated,
    timestamp: new Date().toISOString(),
  });

  const updated = taskManager.get(input.task_id)!;
  const report = progressTracker.getProgressReport(updated);
  const budget = budgetController.summary(updated);

  let instruction = reason;
  if (repeated) {
    instruction =
      "OVERTHINK WARNING: Repeated investigation detected. Do not repeat this action. Change strategy.";
  } else if (!progress) {
    instruction =
      "No useful progress. Narrow scope or change hypothesis before the next action.";
  } else if (budgetController.isStagnating(updated)) {
    instruction =
      "Stagnation detected. Stop repeating approaches and document remaining uncertainty.";
  }

  return {
    progress,
    repeated,
    previous_result: previous?.result,
    stagnation_count: updated.stagnation_count,
    instruction,
    progress_report: report,
    budget,
  };
}
