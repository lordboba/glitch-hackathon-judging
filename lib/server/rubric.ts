import type { CriterionKey, ScorecardInput } from "@/lib/server/types";

export const RUBRIC = [
  {
    key: "innovation",
    label: "Innovation",
    weight: 0.3,
    description: "Freshness of the idea and how clearly it pushes the category forward.",
  },
  {
    key: "execution",
    label: "Execution",
    weight: 0.3,
    description: "Stability, completeness, and whether the product feels real.",
  },
  {
    key: "impact",
    label: "Impact",
    weight: 0.2,
    description: "Practical usefulness and the size of the problem being solved.",
  },
  {
    key: "design",
    label: "Design",
    weight: 0.1,
    description: "Clarity, visual refinement, and information hierarchy.",
  },
  {
    key: "demo",
    label: "Demo",
    weight: 0.1,
    description: "Storytelling, flow, and whether the pitch lands cleanly.",
  },
] as const satisfies Array<{
  key: CriterionKey;
  label: string;
  weight: number;
  description: string;
}>;

export const DEFAULT_ASSIGNMENT_POLICY = {
  scope: "all",
  topN: 5,
  minimumJudges: 2,
  preferTrackJudges: true,
  keepExistingAssignments: true,
} as const;

export const SCORE_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Exceptional",
};

export function clampScore(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function emptyScorecard(): ScorecardInput {
  return {
    innovation: 3,
    execution: 3,
    impact: 3,
    design: 3,
    demo: 3,
    innovationComment: "",
    executionComment: "",
    impactComment: "",
    designComment: "",
    demoComment: "",
    overallComment: "",
  };
}

export function weightedTotal(scores: Pick<ScorecardInput, CriterionKey>) {
  return RUBRIC.reduce((sum, criterion) => {
    return sum + clampScore(scores[criterion.key]) * criterion.weight;
  }, 0);
}
