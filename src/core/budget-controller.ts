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

  summary(task: TaskState) {
    return {
      actions_used: task.actions.length,
      actions_remaining: this.remainingActions(task),
      retries_used: task.actions.filter((a) => !a.progress).length,
      max_retries: task.budget.max_retries,
      stagnation_count: task.stagnation_count,
      can_continue: this.canTakeAction(task) && this.canRetry(task),
    };
  }
}

export const budgetController = new BudgetController();
