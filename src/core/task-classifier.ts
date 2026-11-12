import type { Complexity, ReasoningLevel } from "../types/task.js";

const SIMPLE_PATTERNS = [
  /change\s+(color|text|label|title|button|style)/i,
  /rename\s+/i,
  /update\s+(typo|comment|readme)/i,
  /fix\s+(spelling|typo)/i,
  /add\s+(console\.log|comment)/i,
];

const COMPLEX_PATTERNS = [
  /refactor\s+/i,
  /architecture/i,
  /distributed/i,
  /authentication\s+system/i,
  /migrate\s+/i,
  /redesign/i,
  /security\s+audit/i,
];

const CRITICAL_PATTERNS = [
  /production\s+(outage|down|incident)/i,
  /security\s+(breach|vulnerability)/i,
  /data\s+loss/i,
  /critical\s+bug/i,
  /sev[0-1]/i,
];

const DEBUG_PATTERNS = [
  /error/i,
  /bug/i,
  /fail(ing|ed|ure)/i,
  /500|404|401|403/,
  /crash/i,
  /exception/i,
  /not\s+working/i,
  /broken/i,
];

export function classifyComplexity(task: string): Complexity {
  if (CRITICAL_PATTERNS.some((p) => p.test(task))) return "critical";
  if (COMPLEX_PATTERNS.some((p) => p.test(task))) return "complex";
  if (SIMPLE_PATTERNS.some((p) => p.test(task))) return "simple";
  if (DEBUG_PATTERNS.some((p) => p.test(task))) return "normal";
  // Default to normal for unknown tasks
  return "normal";
}

export function selectReasoningLevel(
  complexity: Complexity,
  allowDeep: boolean
): ReasoningLevel {
  switch (complexity) {
    case "simple":
      return "L0";
    case "normal":
      return "L1";
    case "complex":
      return allowDeep ? "L2" : "L1";
    case "critical":
      return allowDeep ? "L3" : "L2";
    default:
      return "L1";
  }
}

export function extractObjective(task: string): string {
  // Simple heuristic: take first sentence or the whole task
  const cleaned = task.trim().replace(/\s+/g, " ");
  const firstSentence = cleaned.split(/[.!?]/)[0];
  return firstSentence.length > 120
    ? firstSentence.slice(0, 117) + "..."
    : firstSentence || cleaned;
}
