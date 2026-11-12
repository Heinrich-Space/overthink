import type { TaskState } from "../types/task.js";

export class BudgetController {
  canRetry(task: TaskState): boolean {
    const retries = task.actions.filter((a) => !a.progress).length;
    return retries < task.budget.max_retries;
  }

  canTakeAction(task: TaskState): boolean {
    return task.actions.length < task.budget.max_actions;
  }

  isStagnating(task: TaskState, threshold = 2): boolean {
    return task.stagnation_count >= threshold;
  }

  remainingActions(task: TaskState): number {
    return Math.max(0, task.budget.max_actions - task.actions.length);
  }

  /** Urgency for decision engine / UI */
  urgency(task: TaskState): "low" | "medium" | "high" | "critical" {
    const left = this.remainingActions(task);
    if (left <= 1 || task.stagnation_count >= 3) return "critical";
    if (left <= 3 || task.stagnation_count >= 2) return "high";
    if (left <= 5) return "medium";
    return "low";
  }

  summary(task: TaskState) {
    const failRetries = task.actions.filter((a) => !a.progress).length;
    return {
      actions_used: task.actions.length,
      actions_remaining: this.remainingActions(task),
      retries_used: failRetries,
      max_retries: task.budget.max_retries,
      stagnation_count: task.stagnation_count,
      urgency: this.urgency(task),
      can_continue:
        this.canTakeAction(task) &&
        failRetries < task.budget.max_retries &&
        task.stagnation_count < 3,
    };
  }
}

export const budgetController = new BudgetController();
