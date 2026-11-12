import type { TaskState } from "../types/task.js";
import type { InvestigationResult } from "../types/evidence.js";

/**
 * Progressive investigation strategy:
 * 1. Understand the reported problem
 * 2. Identify relevant subsystem
 * 3. Search exact error / symbol
 * 4. Locate implementation
 * 5. Inspect direct dependencies
 * 6. Config / env
 * 7. Related tests & logs
 * 8. Stop when sufficient evidence exists
 */
export class InvestigationEngine {
  private readonly stages = [
    "understand_problem",
    "identify_subsystem",
    "search_error_or_symbol",
    "locate_implementation",
    "inspect_dependencies",
    "inspect_config",
    "inspect_tests_and_logs",
    "sufficient_evidence",
  ] as const;

  suggestScope(task: TaskState, error?: string): string[] {
    const scopes: string[] = [];
    const text = `${task.task} ${error ?? ""}`.toLowerCase();

    if (/auth|login|session|jwt|oauth/.test(text)) {
      scopes.push("src/**/auth*", "src/**/login*", "**/middleware*");
    }
    if (/api|endpoint|route|handler|controller/.test(text)) {
      scopes.push("src/**/routes*", "src/**/controllers*", "src/**/handlers*");
    }
    if (/db|database|sql|query|prisma|mongoose/.test(text)) {
      scopes.push(
        "src/**/db*",
        "src/**/database*",
        "**/prisma*",
        "**/*client*"
      );
    }
    if (/ui|component|button|navbar|style|css/.test(text)) {
      scopes.push("src/**/components*", "**/*.css", "**/*.scss", "**/styles*");
    }
    if (scopes.length === 0) {
      scopes.push("src/");
    }
    return scopes;
  }

  buildInvestigationGuidance(
    task: TaskState,
    error?: string,
    scope?: string[]
  ): InvestigationResult {
    const effectiveScope = scope ?? this.suggestScope(task, error);
    const problem = error ?? task.task;

    const nextStep =
      task.relevant_files.length === 0
        ? "Search for the exact error message or key symbols in the suggested scope"
        : task.evidence.length === 0
          ? "Inspect the most relevant files and collect concrete observations"
          : task.suspected_root_cause
            ? "Verify the suspected root cause with the cheapest distinguishing test"
            : "Form hypotheses from observations and rank by evidence strength";

    return {
      problem,
      relevant_files: task.relevant_files,
      observations: task.observations.map((o) => o.text),
      evidence: task.evidence.map((e) => e.description),
      suspected_root_cause: task.suspected_root_cause,
      confidence: task.confidence,
      next_action: nextStep,
    };
  }

  shouldStop(task: TaskState): boolean {
    if (task.suspected_root_cause && task.confidence >= 0.85) return true;
    if (task.stagnation_count >= 3) return true;
    if (task.evidence.filter((e) => e.classification === "confirmed").length >= 2)
      return true;
    return false;
  }
}

export const investigationEngine = new InvestigationEngine();
