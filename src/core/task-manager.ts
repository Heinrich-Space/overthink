import { v4 as uuidv4 } from "uuid";
import type {
  TaskState,
  Complexity,
  ReasoningLevel,
  Budget,
  ActionRecord,
  Observation,
  EvidenceItem,
  Hypothesis,
  VerificationCheck,
} from "../types/task.js";
import type { OverthinkPolicy } from "../types/policy.js";

export class TaskManager {
  private tasks = new Map<string, TaskState>();

  create(
    task: string,
    options: {
      workspace?: string;
      mode?: string;
      complexity: Complexity;
      reasoning_level: ReasoningLevel;
      objective: string;
      constraints?: string[];
      budget: Budget;
    }
  ): TaskState {
    const now = new Date().toISOString();
    const state: TaskState = {
      task_id: `task_${uuidv4().slice(0, 8)}`,
      task,
      workspace: options.workspace,
      mode: options.mode ?? "auto",
      complexity: options.complexity,
      reasoning_level: options.reasoning_level,
      objective: options.objective,
      constraints: options.constraints ?? [],
      status: "initialized",
      budget: options.budget,
      relevant_files: [],
      observations: [],
      evidence: [],
      hypotheses: [],
      confidence: 0,
      plan: [],
      actions: [],
      stagnation_count: 0,
      verification_checks: [],
      next_action: "overthink_investigate",
      created_at: now,
      updated_at: now,
    };
    this.tasks.set(state.task_id, state);
    return state;
  }

  get(taskId: string): TaskState | undefined {
    return this.tasks.get(taskId);
  }

  update(taskId: string, patch: Partial<TaskState>): TaskState {
    const current = this.tasks.get(taskId);
    if (!current) {
      throw new Error(`Task not found: ${taskId}`);
    }
    const updated: TaskState = {
      ...current,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  addObservation(taskId: string, text: string, source?: string): TaskState {
    const obs: Observation = {
      text,
      source,
      timestamp: new Date().toISOString(),
    };
    const task = this.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return this.update(taskId, {
      observations: [...task.observations, obs],
    });
  }

  addEvidence(taskId: string, item: EvidenceItem): TaskState {
    const task = this.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return this.update(taskId, {
      evidence: [...task.evidence, item],
    });
  }

  addAction(taskId: string, record: ActionRecord): TaskState {
    const task = this.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    const stagnation = record.progress ? 0 : task.stagnation_count + 1;
    return this.update(taskId, {
      actions: [...task.actions, record],
      stagnation_count: stagnation,
    });
  }

  setHypotheses(taskId: string, hypotheses: Hypothesis[]): TaskState {
    return this.update(taskId, { hypotheses });
  }

  setVerification(taskId: string, checks: VerificationCheck[]): TaskState {
    return this.update(taskId, { verification_checks: checks });
  }

  list(): TaskState[] {
    return Array.from(this.tasks.values());
  }

  clear(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }
}

export const taskManager = new TaskManager();
