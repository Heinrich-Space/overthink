import type { Complexity, ReasoningLevel, TaskState } from "../types/task.js";
import { selectReasoningLevel } from "../core/task-classifier.js";
import type { OverthinkPolicy } from "../types/policy.js";

export class ReasoningEngine {
  selectLevel(
    complexity: Complexity,
    policy: OverthinkPolicy
  ): ReasoningLevel {
    return selectReasoningLevel(
      complexity,
      policy.reasoning.allow_deep_reasoning
    );
  }

  describeLevel(level: ReasoningLevel): string {
    switch (level) {
      case "L0":
        return "Direct execution. No formal planning. Make the minimal change.";
      case "L1":
        return "Focused investigation. Inspect a limited set of relevant files, then act.";
      case "L2":
        return "Structured approach. Short plan (3–5 steps), sequential execution, evidence-backed.";
      case "L3":
        return "Deep reasoning. Architecture, dependencies, trade-offs. Still has stopping conditions.";
      default:
        return "Focused investigation.";
    }
  }

  shouldPlan(level: ReasoningLevel, policy: OverthinkPolicy): boolean {
    if (policy.reasoning.avoid_unnecessary_planning && level === "L0") {
      return false;
    }
    return level !== "L0";
  }

  maxPlanSteps(level: ReasoningLevel): number {
    switch (level) {
      case "L0":
        return 0;
      case "L1":
        return 3;
      case "L2":
        return 5;
      case "L3":
        return 8;
      default:
        return 3;
    }
  }

  guidance(task: TaskState): string {
    const level = task.reasoning_level;
    const desc = this.describeLevel(level);
    return [
      `Reasoning level: ${level}`,
      desc,
      `Complexity: ${task.complexity}`,
      `Objective: ${task.objective}`,
      "Rule: Do not spend more effort thinking than the problem requires.",
    ].join("\n");
  }
}

export const reasoningEngine = new ReasoningEngine();
