import type { TaskState } from "../types/task.js";
import { budgetController } from "../core/budget-controller.js";
import { progressTracker } from "../core/progress-tracker.js";
import { planningEngine } from "./planning.engine.js";

export class ExecutionEngine {
  /**
   * Determine the single best next action.
   * Prefers one primary action over long lists of possibilities.
   */
  nextAction(task: TaskState): {
    action: string;
    why: string;
    evidence_required: string;
    avoid: string[];
    stop_condition?: string;
  } {
    if (!budgetController.canTakeAction(task)) {
      return {
        action: "Stop and report current state",
        why: "Action budget exhausted",
        evidence_required: "None",
        avoid: ["Further tool calls without user input"],
        stop_condition: "Budget exceeded",
      };
    }

    if (budgetController.isStagnating(task)) {
      return {
        action: "Change investigation or fix strategy",
        why: "Repeated actions produced no new progress",
        evidence_required: "A new hypothesis or different file/scope",
        avoid: task.actions.slice(-3).map((a) => a.action),
        stop_condition: "If next attempt also yields no progress, document blockers",
      };
    }

    if (task.status === "verifying" || task.verification_checks.length > 0) {
      const pending = task.verification_checks.filter((c) => !c.executed);
      if (pending.length > 0) {
        return {
          action: `Execute verification: ${pending[0].name}`,
          why: "Verification required before claiming completion",
          evidence_required: "Actual test/build output",
          avoid: ["Claiming success without running the check"],
        };
      }
    }

    if (task.suspected_root_cause && task.confidence >= 0.8) {
      return {
        action: "Implement the minimal fix for the confirmed root cause",
        why: "Root cause has sufficient confidence",
        evidence_required: "Diff of the change and targeted test result",
        avoid: [
          "Refactoring unrelated code",
          "Adding abstractions without clear benefit",
        ],
      };
    }

    if (task.evidence.length === 0 || task.relevant_files.length === 0) {
      return {
        action: "Investigate: locate relevant files and collect evidence",
        why: "Insufficient evidence to diagnose safely",
        evidence_required: "File paths, error messages, stack traces, or config values",
        avoid: ["Searching the entire repository repeatedly"],
      };
    }

    const fromPlan = planningEngine.nextStepFromPlan(task);
    if (fromPlan) {
      return {
        action: fromPlan,
        why: "Next step in the current plan",
        evidence_required: "Outcome of the step",
        avoid: ["Skipping verification", "Broad unrelated changes"],
      };
    }

    return {
      action: "Diagnose root cause from collected evidence",
      why: "Evidence exists but root cause not yet confirmed",
      evidence_required: "Hypothesis ranked by evidence strength",
      avoid: ["Treating untested hypotheses as facts"],
    };
  }

  policies(): string[] {
    return [
      "Work on one logical problem at a time",
      "Prefer minimal code changes",
      "Do not repeat an unsuccessful action without changing the hypothesis",
      "Preserve existing architecture unless the task requires changing it",
      "Run targeted tests before broad test suites",
      "Avoid unrelated improvements",
    ];
  }
}

export const executionEngine = new ExecutionEngine();
