import { taskManager } from "../core/task-manager.js";
import {
  classifyComplexity,
  extractObjective,
  selectReasoningLevel,
} from "../core/task-classifier.js";
import { policyEngine } from "../core/policy-engine.js";
import { reasoningEngine } from "../engines/reasoning.engine.js";
import { fastTriage } from "../core/fast-triage.js";
import { disciplineBanner } from "../core/action-guard.js";

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
  const triage = fastTriage(input.task);

  // Tighten budget by triage time box (simple asset/UI stays tiny)
  const max_actions = Math.min(
    budgetCfg.max_actions,
    triage.failure_class === "asset_path" || triage.failure_class === "ui_copy_style"
      ? 4
      : budgetCfg.max_actions
  );

  const state = taskManager.create(input.task, {
    workspace: input.workspace,
    mode: input.mode ?? "auto",
    complexity,
    reasoning_level,
    objective,
    budget: {
      planning_seconds: budgetCfg.planning_seconds,
      investigation_seconds: Math.min(
        budgetCfg.investigation_seconds,
        triage.time_box_minutes * 60
      ),
      max_retries: Math.min(budgetCfg.max_retries, 2),
      max_actions,
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
    triage,
    reasoning_guidance: reasoningEngine.guidance(state),
    discipline: disciplineBanner(),
    next_action: "overthink_next_action",
    mandatory_next:
      "Call overthink_next_action with this task_id. Do only the returned action.",
    hard_limits: {
      max_actions,
      time_box_minutes: triage.time_box_minutes,
      no_sleep: true,
      no_install_before_diagnose: true,
      no_side_paths: triage.out_of_scope,
      one_action_at_a_time: true,
      fail_loop_window: 3,
    },
  };
}
