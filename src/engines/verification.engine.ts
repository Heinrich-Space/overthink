import type { TaskState, VerificationCheck } from "../types/task.js";
import type { VerificationResult } from "../types/evidence.js";

export class VerificationEngine {
  evaluate(checks: VerificationCheck[]): VerificationResult {
    const executed = checks.filter((c) => c.executed);
    const passed = executed.filter((c) => c.passed);
    const failed = executed.filter((c) => !c.passed);

    let status: VerificationResult["status"] = "not_verified";
    if (executed.length === 0) {
      status = "not_verified";
    } else if (failed.length === 0 && passed.length === executed.length) {
      status = "verified";
    } else if (passed.length > 0) {
      status = "partially_verified";
    } else {
      status = "failed";
    }

    return {
      status,
      passed_checks: passed.length,
      failed_checks: failed.length,
      completion_allowed: status === "verified",
    };
  }

  suggestChecks(task: TaskState): string[] {
    const suggestions: string[] = [];
    const t = task.task.toLowerCase();

    if (/ui|style|css|component|button|layout|responsive/.test(t)) {
      suggestions.push("Build succeeds");
      suggestions.push("Visual inspection (desktop + mobile if relevant)");
    }
    if (/api|endpoint|route|handler/.test(t)) {
      suggestions.push("Targeted endpoint / integration test");
      suggestions.push("Manual request against the fixed endpoint");
    }
    if (/db|database|migration|schema/.test(t)) {
      suggestions.push("Migration applies cleanly");
      suggestions.push("Query / repository test");
    }
    if (/auth|login|token|session/.test(t)) {
      suggestions.push("Positive auth flow test");
      suggestions.push("Negative / unauthorized access test");
    }
    if (/refactor/.test(t)) {
      suggestions.push("Existing unit / integration tests still pass");
    }

    if (suggestions.length === 0) {
      suggestions.push("Relevant unit or integration test");
      suggestions.push("Build / typecheck succeeds");
    }
    return suggestions;
  }

  /** Never allow claiming success without actual executed checks */
  guardClaim(task: TaskState, claim: string): string {
    if (/pass|success|fixed|works|verified/i.test(claim)) {
      const hasRealPass = task.verification_checks.some(
        (c) => c.executed && c.passed
      );
      if (!hasRealPass) {
        return (
          "WARNING: Claim of success without executed passing checks. " +
          "Status must be reported as not_verified or partially_verified."
        );
      }
    }
    return claim;
  }
}

export const verificationEngine = new VerificationEngine();
