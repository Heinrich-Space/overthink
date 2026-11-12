import type { TaskState, ReasoningLevel } from "../types/task.js";
import { reasoningEngine } from "./reasoning.engine.js";

export class PlanningEngine {
  generatePlan(task: TaskState): string[] {
    const maxSteps = reasoningEngine.maxPlanSteps(task.reasoning_level);
    if (maxSteps === 0) {
      return ["Execute the minimal required change directly."];
    }

    const plan: string[] = [];

    // Always start with understanding / evidence if needed
    if (task.relevant_files.length === 0) {
      plan.push("Locate relevant files and symbols for the reported problem.");
    }
    if (task.evidence.length === 0 && task.reasoning_level !== "L0") {
      plan.push("Collect concrete evidence (errors, logs, code paths).");
    }
    if (!task.suspected_root_cause && task.reasoning_level !== "L0") {
      plan.push("Form and rank hypotheses; confirm root cause with a cheap test.");
    }
    plan.push("Apply the smallest change that addresses the confirmed issue.");
    plan.push("Run targeted verification (tests / build / visual check).");

    return plan.slice(0, maxSteps);
  }

  isPlanStillValid(task: TaskState): boolean {
    // Simple heuristic: if root cause changed significantly, plan may be invalid
    return task.stagnation_count < 3;
  }

  nextStepFromPlan(task: TaskState): string | undefined {
    if (task.plan.length === 0) return undefined;
    // Rough progress: number of meaningful actions vs plan length
    const done = Math.min(task.actions.filter((a) => a.progress).length, task.plan.length);
    return task.plan[done] ?? task.plan[task.plan.length - 1];
  }
}

export const planningEngine = new PlanningEngine();
