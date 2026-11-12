import { z } from "zod";
import { taskManager } from "../core/task-manager.js";
import { diagnosisEngine } from "../engines/diagnosis.engine.js";

export const diagnoseSchema = z.object({
  task_id: z.string(),
  observations: z.array(z.string()).describe("Observations used for diagnosis"),
});

export type DiagnoseInput = z.infer<typeof diagnoseSchema>;

export function overthinkDiagnose(input: DiagnoseInput) {
  const task = taskManager.get(input.task_id);
  if (!task) throw new Error(`Task not found: ${input.task_id}`);

  taskManager.update(input.task_id, { status: "diagnosing" });

  const result = diagnosisEngine.diagnose(task, input.observations);

  const hypotheses = result.hypotheses.map((h) => ({
    cause: h.cause,
    confidence: h.confidence,
    evidence: h.evidence,
    test: h.test,
    confirmed: result.confirmed && h === result.hypotheses[0],
  }));

  taskManager.setHypotheses(input.task_id, hypotheses);

  if (result.confirmed && result.hypotheses[0]) {
    taskManager.update(input.task_id, {
      suspected_root_cause: result.hypotheses[0].cause,
      confidence: result.hypotheses[0].confidence,
    });
  }

  return {
    ...result,
    note: "Never present a hypothesis as a confirmed root cause without direct evidence.",
  };
}
