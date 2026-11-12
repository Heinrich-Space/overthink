/**
 * Decision engine — pick the highest-value next move under time pressure.
 */

import type { TaskState } from "../types/task.js";
import type { TriageResult } from "./fast-triage.js";
import { budgetController } from "./budget-controller.js";

export type Decision = {
  choice: string;
  why: string;
  value: "critical" | "high" | "medium" | "low";
  reject: string[];
  time_pressure: string;
};

export function decideNext(
  task: TaskState,
  triage: TriageResult
): Decision {
  const remaining = budgetController.remainingActions(task);
  const time_pressure =
    remaining <= 2
      ? "CRITICAL: almost out of actions — finish or report blockers"
      : remaining <= 4
        ? "HIGH: prefer fix/verify over more search"
        : "NORMAL: stay on triage path";

  const reject = [
    ...triage.out_of_scope,
    "repeating the last failed command family",
    "opening unrelated modules",
    "full-repo or full-suite runs before localization",
  ];

  // Hard stop path
  if (remaining <= 0 || task.stagnation_count >= 3) {
    return {
      choice: "STOP and report: evidence so far + blockers + what you need from the user",
      why: "Budget or stagnation exhausted — more exploration has negative ROI",
      value: "critical",
      reject,
      time_pressure,
    };
  }

  // Verified root cause → fix
  if (task.suspected_root_cause && task.confidence >= 0.75) {
    return {
      choice: "Apply the smallest fix for the confirmed cause, then one verification",
      why: "Root cause confidence is high enough to act",
      value: "critical",
      reject: [...reject, "more searching without fixing"],
      time_pressure,
    };
  }

  // Have evidence, need diagnosis
  if (task.evidence.length > 0 && !task.suspected_root_cause) {
    return {
      choice: "Name the single most likely cause and the cheapest test that would kill it",
      why: "Evidence without a decision wastes time",
      value: "high",
      reject,
      time_pressure,
    };
  }

  // Early triage path
  if (task.actions.length === 0 || task.evidence.length === 0) {
    return {
      choice: triage.first_checks[0] ?? "Collect one concrete artifact",
      why: `Triage class=${triage.failure_class} — ${triage.decision_rule}`,
      value: "high",
      reject,
      time_pressure,
    };
  }

  if (task.relevant_files.length === 0) {
    return {
      choice: triage.first_checks[1] ?? "Open the single most likely file",
      why: "Still not localized",
      value: "high",
      reject,
      time_pressure,
    };
  }

  return {
    choice: "Run the cheapest distinguishing test for your top hypothesis",
    why: "Avoid side exploration; kill or confirm the top idea",
    value: "medium",
    reject,
    time_pressure,
  };
}
