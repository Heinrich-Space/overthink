import type { TaskState } from "../types/task.js";
import { budgetController } from "../core/budget-controller.js";
import { progressTracker } from "../core/progress-tracker.js";
import { planningEngine } from "./planning.engine.js";
import { guardProposedAction, disciplineBanner } from "../core/action-guard.js";

export class ExecutionEngine {
  nextAction(task: TaskState): {
    action: string;
    why: string;
    evidence_required: string;
    avoid: string[];
    stop_condition?: string;
    discipline: string;
    hard_rules: string[];
  } {
    const avoid = [
      "sleep / wait loops",
      "Installing packages before diagnosing",
      "Rewriting unrelated modules",
      "Scraping the whole page with new Python deps",
      "Repeating the same curl/search",
      "Creating helper scripts unless strictly necessary",
    ];

    const hard_rules = [
      "Do exactly ONE primary action next",
      "Do not narrate long reasoning — act or ask",
      "If Overthink blocks an action, obey the alternative",
      "Max 3 failed attempts then report to user",
    ];

    if (!budgetController.canTakeAction(task)) {
      return {
        action: "STOP. Report current evidence and blockers to the user.",
        why: "Action budget exhausted",
        evidence_required: "None",
        avoid,
        stop_condition: "Budget exceeded",
        discipline: disciplineBanner(),
        hard_rules,
      };
    }

    if (budgetController.isStagnating(task, 2)) {
      return {
        action:
          "STOP thrashing. Change hypothesis OR ask the user one clarifying question.",
        why: "Two or more actions produced no progress",
        evidence_required: "A different file, URL, or error line — not the same search",
        avoid: [...avoid, ...task.actions.slice(-3).map((a) => a.action)],
        stop_condition: "If still no progress after one different action, finish with blockers",
        discipline: disciplineBanner(),
        hard_rules,
      };
    }

    if (task.status === "verifying" || task.verification_checks.length > 0) {
      const pending = task.verification_checks.filter((c) => !c.executed);
      if (pending.length > 0) {
        return {
          action: `Run verification only: ${pending[0].name}`,
          why: "Verification required before claiming done",
          evidence_required: "Actual command output",
          avoid: [...avoid, "Claiming success without running the check"],
          discipline: disciplineBanner(),
          hard_rules,
        };
      }
    }

    // Domain-specific shortcuts for common user complaints
    const t = task.task.toLowerCase();
    if (/image|img|not show|broken image|src=/.test(t) && task.evidence.length === 0) {
      return {
        action:
          "Identify the exact page URL/port the user opens, then list only FAILED image requests (Network → Img) or broken src attributes — do not write scrapers",
        why: "Image bugs are path/404/CSS problems, not architecture problems",
        evidence_required: "One failing src URL or local path",
        avoid,
        discipline: disciplineBanner(),
        hard_rules,
      };
    }

    if (task.suspected_root_cause && task.confidence >= 0.8) {
      return {
        action: "Apply the smallest fix for the confirmed root cause only",
        why: "Root cause has sufficient confidence",
        evidence_required: "Diff + one verification",
        avoid: [...avoid, "Drive-by refactors"],
        discipline: disciplineBanner(),
        hard_rules,
      };
    }

    if (task.evidence.length === 0 || task.relevant_files.length === 0) {
      return {
        action:
          "Collect minimal evidence: open the failing route/file OR capture the exact error string",
        why: "Not enough evidence to change code safely",
        evidence_required: "File path, error line, or failing URL",
        avoid,
        discipline: disciplineBanner(),
        hard_rules,
      };
    }

    const fromPlan = planningEngine.nextStepFromPlan(task);
    if (fromPlan) {
      return {
        action: fromPlan,
        why: "Next step in the current plan",
        evidence_required: "Outcome of that step only",
        avoid,
        discipline: disciplineBanner(),
        hard_rules,
      };
    }

    return {
      action: "Form one ranked hypothesis and the cheapest test that would falsify it",
      why: "Evidence exists but root cause not confirmed",
      evidence_required: "Test result that supports or kills the hypothesis",
      avoid: [...avoid, "Treating guesses as facts"],
      discipline: disciplineBanner(),
      hard_rules,
    };
  }

  evaluateAction(task: TaskState, proposed: string) {
    return guardProposedAction(proposed, {
      task: task.task,
      stagnation_count: task.stagnation_count,
    });
  }

  policies(): string[] {
    return [
      "One logical problem at a time",
      "Minimal code changes only",
      "Never repeat an unsuccessful action without a new hypothesis",
      "No package installs as a first response to UI bugs",
      "No sleep as a debugging strategy",
      "Preserve architecture unless the task requires changing it",
      "Targeted verification before broad suites",
    ];
  }
}

export const executionEngine = new ExecutionEngine();
