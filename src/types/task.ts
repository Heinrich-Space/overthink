export type ReasoningLevel = "L0" | "L1" | "L2" | "L3";
export type Complexity = "simple" | "normal" | "complex" | "critical";
export type TaskStatus =
  | "initialized"
  | "analyzing"
  | "investigating"
  | "diagnosing"
  | "planning"
  | "executing"
  | "verifying"
  | "completed"
  | "failed"
  | "blocked";

export type EvidenceClassification = "confirmed" | "likely" | "possible" | "unknown";

export interface Budget {
  planning_seconds: number;
  investigation_seconds: number;
  max_retries: number;
  max_actions: number;
}

export interface Observation {
  text: string;
  source?: string;
  timestamp: string;
}

export interface EvidenceItem {
  description: string;
  classification: EvidenceClassification;
  source?: string;
}

export interface Hypothesis {
  cause: string;
  confidence: number;
  evidence: string[];
  test?: string;
  confirmed: boolean;
}

export interface ActionRecord {
  action: string;
  result: string;
  progress: boolean;
  repeated: boolean;
  timestamp: string;
}

export interface VerificationCheck {
  name: string;
  executed: boolean;
  passed: boolean;
  details?: string;
}

export interface TaskState {
  task_id: string;
  task: string;
  workspace?: string;
  mode: string;
  complexity: Complexity;
  reasoning_level: ReasoningLevel;
  objective: string;
  constraints: string[];
  status: TaskStatus;
  budget: Budget;
  relevant_files: string[];
  observations: Observation[];
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  suspected_root_cause?: string;
  confidence: number;
  plan: string[];
  actions: ActionRecord[];
  stagnation_count: number;
  verification_checks: VerificationCheck[];
  verification_status?: "verified" | "partially_verified" | "not_verified" | "failed";
  next_action?: string;
  created_at: string;
  updated_at: string;
}
