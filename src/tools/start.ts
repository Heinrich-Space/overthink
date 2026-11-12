import { taskManager } from "../core/task-manager.js";
import {
  classifyComplexity,
  extractObjective,
  selectReasoningLevel,
} from "../core/task-classifier.js";
import { policyEngine } from "../core/policy-engine.js";
import { reasoningEngine } from "../engines/reasoning.engine.js";

export interface StartInput {
  task: string;
  workspace?: string;
  mode?: string;
}

export function overthinkStart(input: StartInput) {
  const policy = policyEngine.get();
  const complexity = classifyComplexity(input.task);
  const reasoning_level = selectReasoningLevel(
    complexity,
    policy.reasoning.allow_deep_reasoning
  );
  const budgetCfg = policyEngine.getBudget(complexity);
  const objective = extractObjective(input.task);

  const state = taskManager.create(input.task, {
    workspace: input.workspace,
    mode: input.mode ?? "auto",
    complexity,
    reasoning_level,
    objective,
    budget: {
      planning_seconds: budgetCfg.planning_seconds,
      investigation_seconds: budgetCfg.investigation_seconds,
      max_retries: budgetCfg.max_retries,
      max_actions: budgetCfg.max_actions,
    },
  });

  return {
    task_id: state.task_id,
    complexity: state.complexity,
    reasoning_level: state.reasoning_level,
    objective: state.objective,
    constraints: state.constraints,
    verification_required: policy.verification.verify_before_completion,
    budget: state.budget,
    reasoning_guidance: reasoningEngine.guidance(state),
    next_action: "overthink_investigate",
  };
}
