import type { TaskState, Hypothesis } from "../types/task.js";
import type { DiagnosisResult } from "../types/evidence.js";

export class DiagnosisEngine {
  diagnose(
    task: TaskState,
    observations: string[]
  ): DiagnosisResult {
    const allObs = [
      ...task.observations.map((o) => o.text),
      ...observations,
    ];

    const hypotheses = this.generateHypotheses(allObs, task);

    // Rank by confidence
    hypotheses.sort((a, b) => b.confidence - a.confidence);

    const top = hypotheses[0];
    const confirmed =
      !!top && top.confidence >= 0.9 && top.evidence.length >= 2;

    return {
      hypotheses: hypotheses.map((h) => ({
        cause: h.cause,
        confidence: h.confidence,
        evidence: h.evidence,
        test: h.test,
      })),
      recommended_action: top
        ? top.test ?? `Investigate: ${top.cause}`
        : "Gather more specific observations",
      confirmed,
    };
  }

  private generateHypotheses(
    observations: string[],
    task: TaskState
  ): Hypothesis[] {
    const hyps: Hypothesis[] = [];
    const joined = observations.join(" ").toLowerCase();

    // Pattern-based hypothesis generation (lightweight, no external model)
    if (/timeout|connection|econnrefused|enotfound/.test(joined)) {
      hyps.push({
        cause: "Database or external service connection failure",
        confidence: 0.85,
        evidence: observations.filter((o) =>
          /timeout|connection|econnrefused|enotfound/i.test(o)
        ),
        test: "Verify connectivity and configuration of the dependent service",
        confirmed: false,
      });
    }
    if (/undefined|null|cannot read property|typeerror/.test(joined)) {
      hyps.push({
        cause: "Null/undefined reference or missing data",
        confidence: 0.8,
        evidence: observations.filter((o) =>
          /undefined|null|cannot read property|typeerror/i.test(o)
        ),
        test: "Add null checks and inspect the data shape at the failure point",
        confirmed: false,
      });
    }
    if (/401|403|unauthorized|forbidden|token|jwt|auth/.test(joined)) {
      hyps.push({
        cause: "Authentication or authorization failure",
        confidence: 0.82,
        evidence: observations.filter((o) =>
          /401|403|unauthorized|forbidden|token|jwt|auth/i.test(o)
        ),
        test: "Verify token generation, validation, and required claims",
        confirmed: false,
      });
    }
    if (/500|internal server error|unhandled/.test(joined)) {
      hyps.push({
        cause: "Unhandled exception in request handler or downstream service",
        confidence: 0.7,
        evidence: observations.filter((o) =>
          /500|internal server error|unhandled/i.test(o)
        ),
        test: "Inspect server logs and the stack trace at the failing route",
        confirmed: false,
      });
    }

    // Fallback generic hypothesis
    if (hyps.length === 0 && observations.length > 0) {
      hyps.push({
        cause: "Issue located in the primary code path related to the reported symptom",
        confidence: 0.5,
        evidence: observations.slice(0, 3),
        test: "Reproduce the failure and capture the full stack / logs",
        confirmed: false,
      });
    }

    return hyps;
  }

  /** Never present a hypothesis as confirmed without direct evidence */
  assertNotConfirmedAsFact(hyp: Hypothesis): string {
    if (hyp.confirmed) {
      return `Confirmed root cause: ${hyp.cause}`;
    }
    return `Hypothesis (${(hyp.confidence * 100).toFixed(0)}%): ${hyp.cause} — still needs verification`;
  }
}

export const diagnosisEngine = new DiagnosisEngine();
