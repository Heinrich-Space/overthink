export interface InvestigationResult {
  problem: string;
  relevant_files: string[];
  observations: string[];
  evidence: string[];
  suspected_root_cause?: string;
  confidence: number;
  next_action: string;
}

export interface DiagnosisResult {
  hypotheses: Array<{
    cause: string;
    confidence: number;
    evidence: string[];
    test?: string;
  }>;
  recommended_action: string;
  confirmed: boolean;
}

export interface ProgressResult {
  progress: boolean;
  repeated: boolean;
  stagnation_count: number;
  instruction: string;
}

export interface VerificationResult {
  status: "verified" | "partially_verified" | "not_verified" | "failed";
  passed_checks: number;
  failed_checks: number;
  completion_allowed: boolean;
}
