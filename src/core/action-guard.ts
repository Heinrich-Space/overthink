/**
 * Action Guard — blocks waste, side-paths, and loop fuel.
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
    reason: "Sleep burns clock with zero evidence",
    alternative: "One targeted check now",
  },
  {
    pattern: /pip\s+install|npm\s+install\s+(?!.*overthink)|apt\s+install|brew\s+install/i,
    reason: "Installs before diagnosis are a side-path",
    alternative: "Inspect failing file/URL/error with existing tools",
  },
  {
    pattern: /beautifulsoup|bs4|selenium|playwright\s+install/i,
    reason: "Heavy stack for a simple check",
    alternative: "curl, Network panel, or open the source file",
  },
  {
    pattern: /while\s+true|for\s+i\s+in\s+\{\d+\.\.\d{3,}/i,
    reason: "Long loops = thrashing",
    alternative: "One command, inspect output, decide",
  },
  {
    pattern: /find\s+\/\s+-name|find\s+\.\s+-type\s+f(?!.*-maxdepth\s+[123])/i,
    reason: "Unbounded search wastes time",
    alternative: "Search only the feature folder (maxdepth 2–3)",
  },
  {
    pattern: /git\s+log\s+--all|git\s+bisect/i,
    reason: "History dig before current failure is localized",
    alternative: "Reproduce the failure in current tree first",
  },
  {
    pattern: /docker\s+(build|compose)|kubectl|terraform/i,
    reason: "Infra side-path unless the task is infra",
    alternative: "Stay on the application layer until proven otherwise",
  },
  {
    pattern: /npm\s+run\s+test\s*$|pytest\s*$|go\s+test\s+\.\.\./i,
    reason: "Full suite too early slows finish",
    alternative: "Run the single test or check that covers the change",
  },
];

const SIDE_PATH_WHEN_UI = [
  /refactor/i,
  /rewrite\s+(the\s+)?(app|site|component)/i,
  /redesign/i,
  /migrate\s+to/i,
  /clean\s+up\s+the\s+whole/i,
];

export function normalizeActionKey(action: string): string {
  return action
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, "URL")
    .replace(/\d+/g, "N")
    .replace(/['"`].*?['"`]/g, "STR")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function guardProposedAction(
  action: string,
  context?: {
    task?: string;
    stagnation_count?: number;
    recent_keys?: string[];
  }
): GuardVerdict {
  const text = action.trim();
  if (!text) {
    return {
      allowed: false,
      severity: "block",
      reason: "Empty action",
      alternative: "One concrete next step",
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

  const key = normalizeActionKey(text);
  const recent = context?.recent_keys ?? [];
  const similarCount = recent.filter(
    (k) => k === key || (k.length > 20 && key.includes(k.slice(0, 40)))
  ).length;
  if (similarCount >= 1) {
    return {
      allowed: false,
      severity: "block",
      reason: "Near-duplicate of a recent action — loop risk",
      alternative: "Different file, different URL, or different hypothesis",
    };
  }

  const task = context?.task ?? "";
  if (/image|img|src|not\s+show|broken\s+image|404|css|style|button|ui/i.test(task)) {
    for (const p of SIDE_PATH_WHEN_UI) {
      if (p.test(text)) {
        return {
          allowed: false,
          severity: "block",
          reason: "UI/asset task — redesign/refactor is a side-path",
          alternative: "Fix the failing path, selector, or prop only",
        };
      }
    }
  }

  if ((context?.stagnation_count ?? 0) >= 2) {
    return {
      allowed: true,
      severity: "warn",
      reason: "Stagnation high — this must change hypothesis or scope",
      alternative: "Narrow to one file or one failing URL",
    };
  }

  return {
    allowed: true,
    severity: "ok",
    reason: "Action looks on-path",
  };
}

export function disciplineBanner(): string {
  return [
    "OVERTHINK v0.3 — TIME + LOOP DISCIPLINE",
    "- Triage in ≤1 action. Localize in ≤2. Fix small. Verify once.",
    "- Same family of command twice = STOP and change angle.",
    "- No sleep, no installs, no whole-repo find, no full test suite first.",
    "- Side-paths (refactor/redesign/migrate) only if the task asks for them.",
    "- Prefer finish over exploration theater.",
  ].join("\n");
}
