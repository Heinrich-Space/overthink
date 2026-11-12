import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { investigationEngine } from "../engines/investigation.engine.js";

export const investigateSchema = z.object({
  task_id: z.string(),
  error: z.string().optional().describe("Error message or symptom"),
  scope: z.array(z.string()).optional().describe("Optional path scopes to limit search"),
  observations: z.array(z.string()).optional().describe("New observations to record"),
  relevant_files: z.array(z.string()).optional().describe("Files identified as relevant"),
});

export type InvestigateInput = z.infer<typeof investigateSchema>;

export function overthinkInvestigate(input: InvestigateInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  if (input.observations?.length) {
    for (const o of input.observations) {
      taskManager.addObservation(input.task_id, o);
    }
  }
  if (input.relevant_files?.length) {
    taskManager.update(input.task_id, {
      relevant_files: [
        ...new Set([...task.relevant_files, ...input.relevant_files]),
      ],
      status: "investigating",
    });
  } else {
    taskManager.update(input.task_id, { status: "investigating" });
  }

  const updated = taskManager.get(input.task_id)!;
  const guidance = investigationEngine.buildInvestigationGuidance(
    updated,
    input.error,
    input.scope
  );

  const shouldStop = investigationEngine.shouldStop(updated);

  return {
    ...guidance,
    suggested_scope: investigationEngine.suggestScope(updated, input.error),
    stop_investigation: shouldStop,
    instruction: shouldStop
      ? "Sufficient evidence collected. Proceed to diagnosis or fix."
      : "Continue progressive investigation. Prefer exact symbols and direct dependencies over broad searches.",
  };
}
