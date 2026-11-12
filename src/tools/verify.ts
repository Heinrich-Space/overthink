import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { verificationEngine } from "../engines/verification.engine.js";

export const verifySchema = z.object({
  task_id: z.string(),
  checks: z.array(
    z.object({
      name: z.string(),
      executed: z.boolean(),
      passed: z.boolean(),
      details: z.string().optional(),
    })
  ),
});

export type VerifyInput = z.infer<typeof verifySchema>;

export function overthinkVerify(input: VerifyInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  taskManager.setVerification(input.task_id, input.checks);
  const result = verificationEngine.evaluate(input.checks);

  taskManager.update(input.task_id, {
    verification_status: result.status,
    status: result.completion_allowed ? "completed" : "verifying",
  });

  return {
    ...result,
    suggested_checks: verificationEngine.suggestChecks(task),
    note: "Never claim a test passed unless it was actually executed and succeeded.",
  };
}
