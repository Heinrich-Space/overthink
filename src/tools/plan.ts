import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { planningEngine } from "../engines/planning.engine.js";
import { reasoningEngine } from "../engines/reasoning.engine.js";

export const planSchema = z.object({
  task_id: z.string(),
});

export type PlanInput = z.infer<typeof planSchema>;

export function overthinkPlan(input: PlanInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  const plan = planningEngine.generatePlan(task);
  taskManager.update(input.task_id, {
    plan,
    status: "planning",
  });

  return {
    task_id: input.task_id,
    reasoning_level: task.reasoning_level,
    max_steps: reasoningEngine.maxPlanSteps(task.reasoning_level),
    plan,
    guidance:
      "Prefer the smallest plan that achieves the objective. Replan only when new evidence invalidates the current plan.",
  };
}
