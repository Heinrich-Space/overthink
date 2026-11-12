import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { executionEngine } from "../engines/execution.engine.js";
import { budgetController } from "../core/budget-controller.js";

export const nextActionSchema = z.object({
  task_id: z.string(),
});

export type NextActionInput = z.infer<typeof nextActionSchema>;

export function overthinkNextAction(input: NextActionInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  const next = executionEngine.nextAction(task);
  const budget = budgetController.summary(task);

  taskManager.update(input.task_id, {
    next_action: next.action,
    status: "executing",
  });

  return {
    primary_action: next.action,
    why: next.why,
    evidence_required: next.evidence_required,
    avoid: next.avoid,
    stop_condition: next.stop_condition,
    budget,
    execution_policies: executionEngine.policies(),
  };
}
