/**
 * Action Guard — blocks classic overthinking / wasteful agent patterns
 * before the model burns tokens on irrelevant work.
 */

export type GuardVerdict = {
  allowed: boolean;
  severity: "ok" | "warn" | "block";
  reason: string;
  alternative?: string;
};

const WASTE_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  alternative: string;
}> = [
  {
    pattern: /\bsleep\s+\d+/i,
    reason: "Sleeping does not gather evidence or fix code",
    alternative: "Run one targeted check (curl, open file, read error log)",
  },
  {
    pattern: /pip\s+install|npm\s+install\s+(?!.*overthink)|apt\s+install|brew\s+install/i,
    reason: "Installing packages is rarely the first step for a UI/bug fix",
    alternative: "Inspect the failing asset, URL, or error with existing tools first",
  },
  {
    pattern: /beautifulsoup|bs4|selenium|playwright\s+install/i,
    reason: "Heavy scraping stack for a simple page check",
    alternative: "Use curl or a single browser Network panel check",
  },
  {
    pattern: /while\s+true|for\s+i\s+in\s+\{\d+\.\.\d{3,}/i,
    reason: "Long loops look like thrashing, not investigation",
    alternative: "One command, one hypothesis, inspect output",
  },
  {
    pattern: /find\s+\/\s+-name|find\s+\.\s+-type\s+f(?!.*-maxdepth)/i,
    reason: "Unbounded filesystem search",
    alternative: "Search only the project subdirectory that owns the feature",
  },
  {
    pattern: /cat\s+.*\|\s*head|curl.*\|\s*head\s+-5/i,
    reason: "Weak signal; often repeated without a hypothesis",
    alternative: "State what you expect to find, then run one precise command",
  },
];

const IRRELEVANT_WHEN_IMAGE_BUG = [
  /refactor/i,
  /rewrite\s+(the\s+)?(app|site|component)/i,
  /redesign/i,
  /migrate\s+to/i,
];

export function guardProposedAction(
  action: string,
  context?: { task?: string; stagnation_count?: number }
): GuardVerdict {
  const text = action.trim();
  if (!text) {
    return {
      allowed: false,
      severity: "block",
      reason: "Empty action",
      alternative: "Propose one concrete next step",
    };
  }

  for (const w of WASTE_PATTERNS) {
    if (w.pattern.test(text)) {
      return {
        allowed: false,
        severity: "block",
        reason: w.reason,
        alternative: w.alternative,
      };
    }
  }

  const task = context?.task ?? "";
  if (/image|img|src|not\s+show|broken\s+image|404/i.test(task)) {
    for (const p of IRRELEVANT_WHEN_IMAGE_BUG) {
      if (p.test(text)) {
        return {
          allowed: false,
          severity: "block",
          reason: "Task is about missing images; refactor/redesign is out of scope",
          alternative:
            "Find broken img src or CSS background URLs, fix paths only",
        };
      }
    }
  }

  if ((context?.stagnation_count ?? 0) >= 2) {
    return {
      allowed: true,
      severity: "warn",
      reason: "Stagnation high — this action must change hypothesis or scope",
      alternative: "Narrow to one file or one failing URL",
    };
  }

  return {
    allowed: true,
    severity: "ok",
    reason: "Action looks proportionate",
  };
}

export function disciplineBanner(): string {
  return [
    "OVERTHINK DISCIPLINE",
    "- One hypothesis. One action. Then check progress.",
    "- No sleep, no package installs, no broad repo scans as first moves.",
    "- Prefer: open file → fix path → verify. Not: rewrite architecture.",
    "- If two actions produce no new evidence, STOP and report blockers.",
  ].join("\n");
}
