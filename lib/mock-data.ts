export type UserRole = "admin" | "judge" | "builder";

export type Session = {
  name: string;
  email: string;
  role: UserRole;
};

export type HackathonConfig = {
  name: string;
  hostOrganization: string;
  slug: string;
  type: "general" | "ai" | "design" | "climate" | "student" | "internal";
  mode: "in_person" | "hybrid" | "virtual";
  format: "online" | "hybrid" | "onsite";
  visibility: "private" | "application" | "public";
  audience: "open" | "invited" | "campus" | "enterprise";
  judgeAssignmentMode: "assigned" | "track-based" | "open-pool";
  scoringMode: "weighted" | "pass-fail";
  judgingModel: "weighted" | "panel" | "community";
  duration: string;
  timezone: string;
  startDate: string;
  endDate: string;
  location: string;
  maxTeams: number;
  teamSizeMin: number;
  teamSizeMax: number;
  submissionWindowHours: number;
  allowWaitlist: boolean;
  allowLateEdits: boolean;
  requirePortfolio: boolean;
  requireKyc: boolean;
  judgeCount: number;
  mentorCount: number;
  tracks: string[];
  participantRoles: string[];
  organizerGoal: string;
};

export type Invite = {
  code: string;
  email: string;
  role: Exclude<UserRole, "admin">;
  status: "sent" | "accepted" | "ready";
  label: string;
};

export type Assignment = {
  id: string;
  project: string;
  team: string;
  track: string;
  status: "Ready to score" | "Draft in progress" | "Finalized";
  summary: string;
  links: {
    repo: string;
    demo: string;
    submission: string;
  };
  scores: Record<string, number>;
  notes: Record<string, string>;
  overallComment: string;
};

export type ChecklistItem = {
  label: string;
  status: "done" | "in-progress" | "next";
  detail: string;
};

export const scoringRubric = [
  {
    key: "innovation",
    label: "Innovation",
    weight: 0.3,
    description: "How original and ambitious is the product direction?",
  },
  {
    key: "technicalExecution",
    label: "Technical Execution",
    weight: 0.3,
    description: "How credible is the implementation and architecture?",
  },
  {
    key: "impact",
    label: "Impact",
    weight: 0.2,
    description: "How clearly does it solve a real user problem?",
  },
  {
    key: "aesthetics",
    label: "Aesthetics",
    weight: 0.1,
    description: "How strong is the interaction and visual craft?",
  },
  {
    key: "presentation",
    label: "Presentation",
    weight: 0.1,
    description: "How clear is the story, demo, and communication?",
  },
];

export const defaultHackathonConfig: HackathonConfig = {
  name: "AI Builder Finals",
  hostOrganization: "Signal Labs",
  slug: "ai-builder-finals-2026",
  type: "ai",
  mode: "hybrid",
  format: "hybrid",
  visibility: "application",
  audience: "invited",
  judgeAssignmentMode: "assigned",
  scoringMode: "weighted",
  judgingModel: "weighted",
  duration: "72 hours",
  timezone: "America/Los_Angeles",
  startDate: "2026-05-14",
  endDate: "2026-05-17",
  location: "San Francisco, CA",
  maxTeams: 48,
  teamSizeMin: 1,
  teamSizeMax: 4,
  submissionWindowHours: 4,
  allowWaitlist: true,
  allowLateEdits: false,
  requirePortfolio: false,
  requireKyc: false,
  judgeCount: 12,
  mentorCount: 6,
  tracks: ["Developer Tools", "Climate", "Healthcare", "Education"],
  participantRoles: ["Builders", "Judges", "Mentors"],
  organizerGoal:
    "Host a flexible hackathon shell that supports private cohorts, invited judges, and clean scoring operations.",
};

export const participantInviteDirectory: Invite[] = [
  {
    code: "JUDGE-ORBIT-27",
    email: "priya@signaljury.dev",
    role: "judge",
    status: "ready",
    label: "Lead judge",
  },
  {
    code: "BUILD-ATLAS-19",
    email: "northstar@signaljury.dev",
    role: "builder",
    status: "ready",
    label: "Team captain",
  },
  {
    code: "JUDGE-TERRA-08",
    email: "nina@signaljury.dev",
    role: "judge",
    status: "sent",
    label: "Track specialist",
  },
];

export const adminInvites = [
  {
    id: "invite-judge-priya",
    name: "Priya Raman",
    email: "priya@signaljury.dev",
    role: "judge",
    status: "accepted",
    track: "Developer Tools",
  },
  {
    id: "invite-builder-northstar",
    name: "Northstar Labs",
    email: "northstar@signaljury.dev",
    role: "builder",
    status: "sent",
    track: "Developer Tools",
  },
  {
    id: "invite-mentor-nina",
    name: "Nina Torres",
    email: "nina@signaljury.dev",
    role: "mentor",
    status: "pending",
    track: "Climate",
  },
] as const;

export const judgeAssignments: Assignment[] = [
  {
    id: "atlas-relay",
    project: "Atlas Relay",
    team: "Northstar Labs",
    track: "Developer Tools",
    status: "Draft in progress",
    summary:
      "Infrastructure copilot that turns production incidents into rollback-safe remediation plans.",
    links: {
      repo: "https://github.com/",
      demo: "https://example.com/demo",
      submission: "https://example.com/submission",
    },
    scores: {
      innovation: 4,
      technicalExecution: 5,
      impact: 4,
      aesthetics: 3,
      presentation: 4,
    },
    notes: {
      innovation: "Strong wedge with a credible enterprise buyer.",
      technicalExecution: "The architecture story feels unusually complete for a hackathon.",
      impact: "",
      aesthetics: "",
      presentation: "",
    },
    overallComment:
      "Serious finalist. Strong technical credibility and a very clear operational use case.",
  },
  {
    id: "green-grid",
    project: "Green Grid",
    team: "Vector Bloom",
    track: "Climate",
    status: "Ready to score",
    summary:
      "Climate operations workspace for balancing building load against occupancy and tariff signals.",
    links: {
      repo: "https://github.com/",
      demo: "https://example.com/demo",
      submission: "https://example.com/submission",
    },
    scores: {
      innovation: 4,
      technicalExecution: 4,
      impact: 5,
      aesthetics: 4,
      presentation: 4,
    },
    notes: {
      innovation: "",
      technicalExecution: "",
      impact: "Very clear adoption path.",
      aesthetics: "",
      presentation: "",
    },
    overallComment: "",
  },
];

export const builderChecklist: ChecklistItem[] = [
  {
    label: "Team invite roster locked",
    status: "done",
    detail: "All four builders have accepted their invite codes.",
  },
  {
    label: "Project profile completed",
    status: "in-progress",
    detail: "Logo, summary, and demo thumbnail are ready. Need final architecture notes.",
  },
  {
    label: "Submission package sent",
    status: "next",
    detail: "Awaiting the final 90-second demo export before submission.",
  },
];

export const participantAssignments = [
  {
    id: "atlas-relay",
    title: "Atlas Relay",
    teamName: "Northstar Labs",
    summary:
      "Infrastructure copilot that turns production incidents into rollback-safe remediation plans.",
    description:
      "Atlas Relay ingests production traces, postmortems, and deployment metadata to build rollback-safe action plans for operators.",
    track: "Developer Tools",
    stage: "Draft in progress",
    repoUrl: "https://github.com/",
    demoUrl: "https://example.com/demo",
    invitationCode: "JUDGE-ORBIT-27",
    inviteStatus: "accepted",
    readiness: "ready",
    scores: {
      innovation: 4,
      execution: 5,
      impact: 4,
      design: 3,
      demo: 4,
    },
    comments: {
      innovation: "Strong wedge with a credible enterprise buyer.",
      execution: "The architecture story feels unusually complete for a hackathon.",
    },
    overallComment:
      "Serious finalist. Strong technical credibility and a very clear operational use case.",
  },
  {
    id: "green-grid",
    title: "Green Grid",
    teamName: "Vector Bloom",
    summary:
      "Climate operations workspace for balancing building load against occupancy and tariff signals.",
    description:
      "Green Grid helps facilities teams make carbon-aware HVAC decisions using occupancy, tariff, and weather signals.",
    track: "Climate",
    stage: "Ready to score",
    repoUrl: "https://github.com/",
    demoUrl: "https://example.com/demo",
    invitationCode: "JUDGE-TERRA-08",
    inviteStatus: "sent",
    readiness: "needs-review",
    scores: {
      innovation: 4,
      execution: 4,
      impact: 5,
      design: 4,
      demo: 4,
    },
    comments: {
      impact: "Very clear adoption path.",
    },
    overallComment: "",
  },
] as const;

export const participantBuilderChecklist = [
  {
    id: "roster",
    label: "Team invite roster locked",
    detail: "All four builders have accepted their invite codes.",
    done: true,
  },
  {
    id: "profile",
    label: "Project profile completed",
    detail: "Logo, summary, and demo thumbnail are ready. Need final architecture notes.",
    done: false,
  },
  {
    id: "submit",
    label: "Submission package sent",
    detail: "Awaiting the final 90-second demo export before submission.",
    done: false,
  },
] as const;
