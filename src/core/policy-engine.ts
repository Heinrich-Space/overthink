import { readFileSync, existsSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import {
  DEFAULT_POLICY,
  type OverthinkPolicy,
} from "../types/policy.js";
import type { Complexity } from "../types/task.js";

export class PolicyEngine {
  private policy: OverthinkPolicy;

  constructor(policyPath?: string) {
    this.policy = this.load(policyPath);
  }

  private load(path?: string): OverthinkPolicy {
    if (!path || !existsSync(path)) {
      return structuredClone(DEFAULT_POLICY);
    }
    try {
      const raw = readFileSync(path, "utf-8");
      const parsed = parseYaml(raw);
      const config = parsed?.overthink ?? parsed;
      return {
        ...DEFAULT_POLICY,
        ...config,
        reasoning: { ...DEFAULT_POLICY.reasoning, ...config?.reasoning },
        execution: { ...DEFAULT_POLICY.execution, ...config?.execution },
        investigation: {
          ...DEFAULT_POLICY.investigation,
          ...config?.investigation,
        },
        budgets: { ...DEFAULT_POLICY.budgets, ...config?.budgets },
        verification: {
          ...DEFAULT_POLICY.verification,
          ...config?.verification,
        },
        communication: {
          ...DEFAULT_POLICY.communication,
          ...config?.communication,
        },
      };
    } catch {
      return structuredClone(DEFAULT_POLICY);
    }
  }

  get(): OverthinkPolicy {
    return this.policy;
  }

  getBudget(complexity: Complexity) {
    return this.policy.budgets[complexity] ?? this.policy.budgets.normal;
  }

  shouldRequireEvidence(): boolean {
    return this.policy.investigation.evidence_required;
  }

  shouldDetectDuplicates(): boolean {
    return this.policy.investigation.detect_duplicate_searches;
  }

  shouldUseMinimalChanges(): boolean {
    return this.policy.execution.minimal_changes;
  }

  shouldVerifyBeforeCompletion(): boolean {
    return this.policy.verification.verify_before_completion;
  }

  isConcise(): boolean {
    return this.policy.communication.concise;
  }
}

export const policyEngine = new PolicyEngine();
