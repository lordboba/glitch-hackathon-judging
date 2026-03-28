export type AppRole = "admin" | "judge";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

export type CriterionKey = "innovation" | "execution" | "impact" | "design" | "demo";

export type ScorecardInput = {
  innovation: number;
  execution: number;
  impact: number;
  design: number;
  demo: number;
  innovationComment: string;
  executionComment: string;
  impactComment: string;
  designComment: string;
  demoComment: string;
  overallComment: string;
};

export type AssignmentPolicyInput = {
  scope: "all" | "top20" | "topN";
  topN: number;
  minimumJudges: number;
  preferTrackJudges: boolean;
  keepExistingAssignments: boolean;
};

export type CsvMappingTarget =
  | "ignore"
  | "project_name"
  | "team_name"
  | "description"
  | "video_url"
  | "repo_url"
  | "submission_url"
  | "track"
  | "score";

export type CsvPreview = {
  headers: string[];
  sampleRows: Array<Record<string, string>>;
  suggestedMapping: Partial<Record<CsvMappingTarget, string>>;
  requiredTargets: CsvMappingTarget[];
};

export type LeaderboardEntry = {
  rank: number;
  projectId: string;
  projectName: string;
  teamName: string;
  track: string | null;
  submittedScorecards: number;
  averageScore: number;
  screeningScore: number | null;
  manualAdjustment: number;
  finalScore: number;
  tieBreakerNote: string;
  status: string;
};
