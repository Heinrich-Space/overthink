import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { executionEngine } from "../engines/execution.engine.js";
import {
  guardProposedAction,
  disciplineBanner,
  normalizeActionKey,
} from "../core/action-guard.js";

export const guardSchema = z.object({
  task_id: z.string().optional(),
  proposed_action: z
    .string()
    .describe("The next command or step the agent wants to take"),
  task_hint: z
    .string()
    .optional()
    .describe("Original user task if task_id is unknown"),
});

export type GuardInput = z.infer<typeof guardSchema>;

export function overthinkGuard(input: GuardInput) {
  const task = input.task_id ? taskManager.get(input.task_id) : undefined;

  const verdict = task
    ? executionEngine.evaluateAction(task, input.proposed_action)
    : guardProposedAction(input.proposed_action, {
        task: input.task_hint,
        recent_keys: [],
      });

  return {
    ...verdict,
    action_key: normalizeActionKey(input.proposed_action),
    discipline: disciplineBanner(),
    instruction: verdict.allowed
      ? "Proceed with this single action, then overthink_check_progress."
      : `BLOCKED. Do not run it. ${verdict.alternative ?? "Pick a smaller on-path step."}`,
  };
}
