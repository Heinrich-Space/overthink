import type { TaskState, ActionRecord } from "../types/task.js";

export class ProgressTracker {
  detectRepetition(
    task: TaskState,
    action: string
  ): { repeated: boolean; previous?: ActionRecord } {
    const normalized = action.toLowerCase().trim();
    const previous = [...task.actions]
      .reverse()
      .find((a) => a.action.toLowerCase().trim() === normalized);
    return {
      repeated: !!previous,
      previous,
    };
  }

  evaluateProgress(
    task: TaskState,
    action: string,
    result: string
  ): { progress: boolean; reason: string } {
    const lower = result.toLowerCase();
    const noProgressSignals = [
      "no new",
      "already known",
      "same as before",
      "no relevant",
      "nothing found",
      "no change",
      "unchanged",
    ];
    const progressSignals = [
      "found",
      "identified",
      "confirmed",
      "fixed",
      "implemented",
      "passed",
      "resolved",
      "new evidence",
      "root cause",
    ];

    if (noProgressSignals.some((s) => lower.includes(s))) {
      return { progress: false, reason: "No new evidence produced" };
    }
    if (progressSignals.some((s) => lower.includes(s))) {
      return { progress: true, reason: "New evidence or progress detected" };
    }
    // Default: assume progress if result is non-empty and different
    return {
      progress: result.trim().length > 10,
      reason: "Result recorded",
    };
  }

  getProgressReport(task: TaskState) {
    return {
      objective_identified: !!task.objective,
      relevant_files_located: task.relevant_files.length > 0,
      root_cause_confirmed:
        !!task.suspected_root_cause && task.confidence >= 0.8,
      fix_implemented: task.actions.some((a) =>
        /fix|implement|change|patch/i.test(a.action)
      ),
      tests_executed: task.verification_checks.some((c) => c.executed),
      regression_verified: task.verification_status === "verified",
      stagnation_count: task.stagnation_count,
      total_actions: task.actions.length,
    };
  }
}

export const progressTracker = new ProgressTracker();
