type EventSystemDefaults = {
  type: string;
  mode: string;
  format: string;
  visibility: string;
  audience: string;
  judgeAssignmentMode: string;
  scoringMode: string;
  judgingModel: string;
  duration: string;
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
  participantRoles: string[];
};

export const eventSystemDefaults: EventSystemDefaults = {
  type: "ai",
  mode: "hybrid",
  format: "hybrid",
  visibility: "application",
  audience: "invited",
  judgeAssignmentMode: "assigned",
  scoringMode: "weighted",
  judgingModel: "weighted",
  duration: "72 hours",
  maxTeams: 48,
  teamSizeMin: 1,
  teamSizeMax: 4,
  submissionWindowHours: 4,
  allowWaitlist: true,
  allowLateEdits: false,
  requirePortfolio: false,
  requireKyc: false,
  judgeCount: 0,
  mentorCount: 0,
  participantRoles: ["Builders", "Judges", "Mentors"],
};

export const knownPlaceholderEventTemplate = {
  name: "AI Builder Finals",
  hostOrganization: "Signal Labs",
  slug: "ai-builder-finals-2026",
  timezone: "America/Los_Angeles",
  startDate: "2026-05-14",
  endDate: "2026-05-17",
  location: "San Francisco, CA",
  tracks: ["Developer Tools", "Climate", "Healthcare", "Education"],
  organizerGoal:
    "Host a flexible hackathon shell that supports private cohorts, invited judges, and clean scoring operations.",
} as const;

export const knownPlaceholderProjectNames = ["Atlas Relay", "Green Grid"] as const;
export const knownPlaceholderTeamNames = ["Northstar Labs", "Vector Bloom"] as const;
export const knownPlaceholderEmailDomains = ["signaljury.dev", "glitchgraders.dev"] as const;
export const knownPlaceholderLinkPrefixes = ["https://example.com/"] as const;

export function parseTrackList(input: string) {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function requireText(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required`);
  }

  return trimmed;
}

export function parseRequiredDate(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} is required`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} is invalid`);
  }

  return parsed;
}

export function listMatchingPlaceholderEventFields(event: {
  name: string;
  hostOrganization: string;
  slug: string;
  timezone: string;
  startDate: Date;
  endDate: Date;
  location: string;
  tracks: string[];
  organizerGoal: string;
}) {
  const matches: string[] = [];

  if (event.name === knownPlaceholderEventTemplate.name) matches.push("name");
  if (event.hostOrganization === knownPlaceholderEventTemplate.hostOrganization) {
    matches.push("hostOrganization");
  }
  if (event.slug === knownPlaceholderEventTemplate.slug) matches.push("slug");
  if (event.timezone === knownPlaceholderEventTemplate.timezone) matches.push("timezone");
  if (event.startDate.toISOString().slice(0, 10) === knownPlaceholderEventTemplate.startDate) {
    matches.push("startDate");
  }
  if (event.endDate.toISOString().slice(0, 10) === knownPlaceholderEventTemplate.endDate) {
    matches.push("endDate");
  }
  if (event.location === knownPlaceholderEventTemplate.location) matches.push("location");
  if (JSON.stringify(event.tracks) === JSON.stringify(knownPlaceholderEventTemplate.tracks)) {
    matches.push("tracks");
  }
  if (event.organizerGoal === knownPlaceholderEventTemplate.organizerGoal) {
    matches.push("organizerGoal");
  }

  return matches;
}
