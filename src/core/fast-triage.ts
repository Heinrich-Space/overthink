/**
 * Fast triage — classify the failure mode in one pass so the agent
 * does not wander through unrelated subsystems.
 */

export type FailureClass =
  | "asset_path"
  | "ui_copy_style"
  | "runtime_error"
  | "build_config"
  | "api_network"
  | "logic_bug"
  | "unknown";

export type TriageResult = {
  failure_class: FailureClass;
  confidence: number;
  first_checks: string[];
  out_of_scope: string[];
  time_box_minutes: number;
  decision_rule: string;
};

export function fastTriage(task: string): TriageResult {
  const t = task.toLowerCase();

  if (/image|img|src=|favicon|static\/|not\s+show(ing)?|broken\s+image|404.*\.(png|jpg|svg|webp)/i.test(t)) {
    return {
      failure_class: "asset_path",
      confidence: 0.9,
      first_checks: [
        "Confirm the URL/port the user opens",
        "Find img/src or CSS url() that 404",
        "Fix path or file only",
      ],
      out_of_scope: ["refactor", "new framework", "Python scrapers", "full redesign"],
      time_box_minutes: 5,
      decision_rule: "One failing URL → one path fix → hard refresh",
    };
  }

  if (/color|button|label|text|font|css|style|layout|spacing|typo/i.test(t)) {
    return {
      failure_class: "ui_copy_style",
      confidence: 0.85,
      first_checks: [
        "Open the component or CSS file that owns the element",
        "Change the single property/string",
        "Visual check",
      ],
      out_of_scope: ["state management rewrite", "new design system"],
      time_box_minutes: 5,
      decision_rule: "Smallest diff that matches the request",
    };
  }

  if (/cors|fetch\s+fail|network|api\s+error|timeout|502|503|econnrefused/i.test(t)) {
    return {
      failure_class: "api_network",
      confidence: 0.8,
      first_checks: [
        "Capture exact status + response body",
        "Confirm base URL / env",
        "One request reproduction",
      ],
      out_of_scope: ["UI polish", "unrelated refactors"],
      time_box_minutes: 15,
      decision_rule: "Reproduce → fix endpoint/env/headers → one successful call",
    };
  }

  if (/compil|typescript|build\s+fail|webpack|vite|module\s+not\s+found|cannot\s+find\s+module/i.test(t)) {
    return {
      failure_class: "build_config",
      confidence: 0.85,
      first_checks: [
        "Read the first error line only",
        "Open the cited file:line",
        "Fix import/path/type",
      ],
      out_of_scope: ["feature work", "style changes"],
      time_box_minutes: 10,
      decision_rule: "First compiler error only until green",
    };
  }

  if (/error|exception|stack|crash|undefined|null\s+is\s+not|typeerror|referenceerror/i.test(t)) {
    return {
      failure_class: "runtime_error",
      confidence: 0.75,
      first_checks: [
        "Capture full stack top 5 frames",
        "Open top app frame file",
        "Minimal guard or correct value",
      ],
      out_of_scope: ["drive-by refactors", "new abstractions"],
      time_box_minutes: 15,
      decision_rule: "Top frame → cause → minimal fix → re-run path",
    };
  }

  if (/bug|wrong|incorrect|logic|not\s+work|broken|fail/i.test(t)) {
    return {
      failure_class: "logic_bug",
      confidence: 0.6,
      first_checks: [
        "State expected vs actual in one sentence",
        "Find the function that produces the wrong value",
        "One unit or manual check",
      ],
      out_of_scope: ["rewrites", "unrelated modules"],
      time_box_minutes: 20,
      decision_rule: "Expected vs actual → single function → fix → verify",
    };
  }

  return {
    failure_class: "unknown",
    confidence: 0.4,
    first_checks: [
      "Restate the success condition in one line",
      "Gather one concrete artifact (error, screenshot description, file)",
    ],
    out_of_scope: ["broad exploration without a hypothesis"],
    time_box_minutes: 15,
    decision_rule: "Artifact first, then one hypothesis",
  };
}
