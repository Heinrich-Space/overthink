import type { Complexity, ReasoningLevel } from "./task.js";

export interface BudgetConfig {
  max_retries: number;
  max_actions: number;
  planning_seconds: number;
  investigation_seconds: number;
}

export interface OverthinkPolicy {
  mode: string;
  reasoning: {
    default_level: ReasoningLevel;
    allow_deep_reasoning: boolean;
    avoid_unnecessary_planning: boolean;
  };
  execution: {
    minimal_changes: boolean;
    avoid_unrelated_refactoring: boolean;
    one_primary_action: boolean;
  };
  investigation: {
    evidence_required: boolean;
    detect_duplicate_searches: boolean;
    progressive_search: boolean;
  };
  budgets: Record<Complexity, BudgetConfig>;
  verification: {
    require_tests_when_applicable: boolean;
    verify_before_completion: boolean;
  };
  communication: {
    concise: boolean;
    no_reasoning_narration: boolean;
    report_unverified_results: boolean;
  };
}

export const DEFAULT_POLICY: OverthinkPolicy = {
  mode: "adaptive",
  reasoning: {
    default_level: "L1",
    allow_deep_reasoning: true,
    avoid_unnecessary_planning: true,
  },
  execution: {
    minimal_changes: true,
    avoid_unrelated_refactoring: true,
    one_primary_action: true,
  },
  investigation: {
    evidence_required: true,
    detect_duplicate_searches: true,
    progressive_search: true,
  },
  budgets: {
    simple: {
      max_retries: 1,
      max_actions: 5,
      planning_seconds: 5,
      investigation_seconds: 10,
    },
    normal: {
      max_retries: 2,
      max_actions: 12,
      planning_seconds: 15,
      investigation_seconds: 30,
    },
    complex: {
      max_retries: 3,
      max_actions: 30,
      planning_seconds: 45,
      investigation_seconds: 90,
    },
    critical: {
      max_retries: 5,
      max_actions: 50,
      planning_seconds: 60,
      investigation_seconds: 180,
    },
  },
  verification: {
    require_tests_when_applicable: true,
    verify_before_completion: true,
  },
  communication: {
    concise: true,
    no_reasoning_narration: true,
    report_unverified_results: true,
  },
};
