import type { TaskState } from "../types/task.js";
import { budgetController } from "../core/budget-controller.js";
import { progressTracker } from "../core/progress-tracker.js";
import { planningEngine } from "./planning.engine.js";
import {
  guardProposedAction,
  disciplineBanner,
  normalizeActionKey,
} from "../core/action-guard.js";
import { fastTriage } from "../core/fast-triage.js";
import { decideNext } from "../core/decision-engine.js";

export class ExecutionEngine {
  nextAction(task: TaskState): {
    action: string;
    why: string;
    evidence_required: string;
    avoid: string[];
    stop_condition?: string;
    discipline: string;
    hard_rules: string[];
    triage?: ReturnType<typeof fastTriage>;
    decision?: ReturnType<typeof decideNext>;
    time_efficiency: string;
  } {
    const triage = fastTriage(task.task);
    const decision = decideNext(task, triage);

    const avoid = [
      ...triage.out_of_scope,
      "sleep / wait loops",
      "installs before diagnosis",
      "scrapers for simple checks",
      "repeating the same command family",
      "full test suite before localization",
      "unrelated module rewrites",
    ];

    const hard_rules = [
      "ONE primary action only",
      "If similar action already failed → change angle immediately",
      "Prefer finish over more search when urgency is high/critical",
      "Obey overthink_guard BLOCK without argument",
    ];

    const time_efficiency = `class=${triage.failure_class} time_box~${triage.time_box_minutes}m rule="${triage.decision_rule}" urgency=${budgetController.urgency(task)}`;

    if (!budgetController.canTakeAction(task) || progressTracker.isFailLoop(task)) {
      return {
        action: decision.choice,
        why: decision.why,
        evidence_required: "Summary for user only",
        avoid,
        stop_condition: "Fail-loop or budget empty",
        discipline: disciplineBanner(),
        hard_rules,
        triage,
        decision,
        time_efficiency,
      };
    }

    if (budgetController.isStagnating(task, 2)) {
      return {
        action:
          "STOP thrashing. Different hypothesis OR one clarifying question to the user.",
        why: "Stagnation — more of the same has negative expected value",
        evidence_required: "New angle only",
        avoid: [...avoid, ...task.actions.slice(-3).map((a) => a.action)],
        stop_condition: "One different action max, then finish with blockers",
        discipline: disciplineBanner(),
        hard_rules,
        triage,
        decision,
        time_efficiency,
      };
    }

    if (task.status === "verifying" || task.verification_checks.length > 0) {
      const pending = task.verification_checks.filter((c) => !c.executed);
      if (pending.length > 0) {
        return {
          action: `Run only: ${pending[0].name}`,
          why: "Verification is the path to finish",
          evidence_required: "Real command output",
          avoid: [...avoid, "claiming done without running it"],
          discipline: disciplineBanner(),
          hard_rules,
          triage,
          decision,
          time_efficiency,
        };
      }
    }

    // Prefer decision engine output (triage-aware)
    return {
      action: decision.choice,
      why: decision.why,
      evidence_required:
        task.evidence.length === 0
          ? "One artifact (error, path, failing URL)"
          : "Outcome that confirms or kills top hypothesis",
      avoid,
      discipline: disciplineBanner(),
      hard_rules,
      triage,
      decision,
      time_efficiency,
    };
  }

  evaluateAction(task: TaskState, proposed: string) {
    const recent_keys = task.actions.slice(-5).map((a) => normalizeActionKey(a.action));
    return guardProposedAction(proposed, {
      task: task.task,
      stagnation_count: task.stagnation_count,
      recent_keys,
    });
  }

  policies(): string[] {
    return [
      "Fast triage before exploration",
      "One logical problem at a time",
      "Kill fail-loops early (similar actions count)",
      "Time-box by failure class",
      "Minimal code changes only",
      "Finish bias under high urgency",
      "No side-paths unless the task requests them",
    ];
  }
}

export const executionEngine = new ExecutionEngine();
