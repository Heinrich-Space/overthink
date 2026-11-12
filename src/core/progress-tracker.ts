import type { TaskState, ActionRecord } from "../types/task.js";
import { normalizeActionKey } from "./action-guard.js";

export class ProgressTracker {
  detectRepetition(
    task: TaskState,
    action: string
  ): { repeated: boolean; similar: boolean; previous?: ActionRecord } {
    const exact = action.toLowerCase().trim();
    const key = normalizeActionKey(action);

    const previousExact = [...task.actions]
      .reverse()
      .find((a) => a.action.toLowerCase().trim() === exact);

    const previousSimilar = [...task.actions]
      .reverse()
      .find((a) => {
        const k = normalizeActionKey(a.action);
        return k === key || (k.length > 15 && (key.includes(k.slice(0, 30)) || k.includes(key.slice(0, 30))));
      });

    return {
      repeated: !!previousExact,
      similar: !previousExact && !!previousSimilar,
      previous: previousExact ?? previousSimilar,
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
      "still failing",
      "same error",
      "exit code: 1",
      "command not found",
      "module not found",
      "timed out",
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
      "200",
      "success",
      "diff",
    ];

    if (noProgressSignals.some((s) => lower.includes(s))) {
      return { progress: false, reason: "No new useful evidence" };
    }
    if (progressSignals.some((s) => lower.includes(s))) {
      return { progress: true, reason: "Forward signal in result" };
    }
    return {
      progress: result.trim().length > 20,
      reason: "Result recorded — treat as weak progress only",
    };
  }

  /** Fail-loop: last N actions all non-progress */
  isFailLoop(task: TaskState, window = 3): boolean {
    const last = task.actions.slice(-window);
    if (last.length < window) return false;
    return last.every((a) => !a.progress);
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
      fail_loop: this.isFailLoop(task),
    };
  }
}

export const progressTracker = new ProgressTracker();
