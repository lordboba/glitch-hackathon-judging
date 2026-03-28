"use client";

import { useMemo, useState } from "react";

type HackathonConfig = {
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

type EventRecord = {
  id: string;
  name: string;
  slug: string;
  format: string;
  audience: string;
  status: "Draft" | "Open intake" | "Judging live";
  startDate: string;
  endDate: string;
  projectCount: number;
  judgeCount: number;
};

type ProjectRecord = {
  id: string;
  projectName: string;
  teamName: string;
  track: string;
  description: string;
  videoUrl: string;
  repoUrl: string;
  score: number;
  status: "Ready" | "Missing video" | "Needs review";
  assignedJudgeIds: string[];
  manualAdjustment: number;
  tieBreakerNote: string;
};

type JudgeRecord = {
  id: string;
  name: string;
  track: string;
  capacity: number;
  currentAssignments: number;
};

type CsvMappingTarget =
  | "ignore"
  | "project_name"
  | "team_name"
  | "description"
  | "video_url"
  | "repo_url"
  | "track"
  | "score";

type CsvMappingRow = {
  source: string;
  sample: string;
  target: CsvMappingTarget;
  required: boolean;
};

type AssignmentPolicy = {
  scope: "all" | "top20" | "topN";
  topN: number;
  minimumJudges: number;
  preferTrackJudges: boolean;
  keepExistingAssignments: boolean;
};

type PlanPreview = {
  selectedProjectIds: string[];
  assignmentMap: Record<string, string[]>;
  judgeLoads: Record<string, number>;
};

type AdminPortalProps = {
  organizerName: string;
  initialConfig: HackathonConfig;
};

const eventSeed = (config: HackathonConfig): EventRecord[] => [
  {
    id: "event-main",
    name: config.name,
    slug: config.slug,
    format: config.format,
    audience: config.audience,
    status: "Judging live",
    startDate: config.startDate,
    endDate: config.endDate,
    projectCount: 12,
    judgeCount: config.judgeCount,
  },
  {
    id: "event-campus",
    name: "Campus Sprint Weekend",
    slug: "campus-sprint-weekend",
    format: "onsite",
    audience: "campus",
    status: "Draft",
    startDate: "2026-06-12",
    endDate: "2026-06-14",
    projectCount: 0,
    judgeCount: 6,
  },
];

const judgeSeed: JudgeRecord[] = [
  { id: "judge-priya", name: "Priya Raman", track: "Developer Tools", capacity: 6, currentAssignments: 3 },
  { id: "judge-nina", name: "Nina Torres", track: "Climate", capacity: 5, currentAssignments: 2 },
  { id: "judge-marcus", name: "Marcus Lee", track: "Healthcare", capacity: 5, currentAssignments: 2 },
  { id: "judge-zoe", name: "Zoe Carter", track: "Education", capacity: 4, currentAssignments: 1 },
  { id: "judge-ian", name: "Ian Park", track: "Developer Tools", capacity: 5, currentAssignments: 2 },
];

const projectSeed: ProjectRecord[] = [
  {
    id: "p1",
    projectName: "Atlas Relay",
    teamName: "Northstar Labs",
    track: "Developer Tools",
    description: "Incident remediation copilot that drafts rollback-safe plans from logs and deploy traces.",
    videoUrl: "https://example.com/video/atlas-relay",
    repoUrl: "https://github.com/example/atlas-relay",
    score: 4.82,
    status: "Ready",
    assignedJudgeIds: ["judge-priya", "judge-ian"],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p2",
    projectName: "Green Grid",
    teamName: "Vector Bloom",
    track: "Climate",
    description: "Building load optimizer combining occupancy, weather, and tariff signals for carbon-aware operations.",
    videoUrl: "https://example.com/video/green-grid",
    repoUrl: "https://github.com/example/green-grid",
    score: 4.76,
    status: "Ready",
    assignedJudgeIds: ["judge-nina"],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p3",
    projectName: "ClinicFlow",
    teamName: "Octave Studio",
    track: "Healthcare",
    description: "Clinic workflow assistant for intake, triage, and multilingual follow-up coordination.",
    videoUrl: "",
    repoUrl: "https://github.com/example/clinicflow",
    score: 4.71,
    status: "Missing video",
    assignedJudgeIds: ["judge-marcus"],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p4",
    projectName: "Lesson Loop",
    teamName: "Open Signal",
    track: "Education",
    description: "Teacher workspace that turns student feedback and lesson plans into differentiated follow-ups.",
    videoUrl: "https://example.com/video/lesson-loop",
    repoUrl: "https://github.com/example/lesson-loop",
    score: 4.63,
    status: "Ready",
    assignedJudgeIds: ["judge-zoe"],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p5",
    projectName: "Permit Pilot",
    teamName: "Civic Patch",
    track: "Developer Tools",
    description: "Permit-review assistant with scenario simulations for planning departments.",
    videoUrl: "https://example.com/video/permit-pilot",
    repoUrl: "https://github.com/example/permit-pilot",
    score: 4.57,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p6",
    projectName: "Coastline",
    teamName: "Terraform",
    track: "Climate",
    description: "Flood resilience planning tool that compares local adaptation options against parcel-level risk.",
    videoUrl: "https://example.com/video/coastline",
    repoUrl: "https://github.com/example/coastline",
    score: 4.55,
    status: "Needs review",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p7",
    projectName: "Rounds",
    teamName: "Care Thread",
    track: "Healthcare",
    description: "Care continuity product for discharge teams coordinating follow-up and medication reminders.",
    videoUrl: "https://example.com/video/rounds",
    repoUrl: "https://github.com/example/rounds",
    score: 4.44,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p8",
    projectName: "Sketchboard",
    teamName: "Bright Day",
    track: "Education",
    description: "Collaborative lesson ideation board that converts standards into activity plans and demos.",
    videoUrl: "https://example.com/video/sketchboard",
    repoUrl: "https://github.com/example/sketchboard",
    score: 4.31,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p9",
    projectName: "Ledger Drift",
    teamName: "Signal Foundry",
    track: "Developer Tools",
    description: "Cost anomaly investigator for engineering teams using infrastructure and billing telemetry.",
    videoUrl: "https://example.com/video/ledger-drift",
    repoUrl: "https://github.com/example/ledger-drift",
    score: 4.23,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p10",
    projectName: "Care Atlas",
    teamName: "Bridge Labs",
    track: "Healthcare",
    description: "Referral intelligence system mapping patient pathways and specialist availability in real time.",
    videoUrl: "https://example.com/video/care-atlas",
    repoUrl: "https://github.com/example/care-atlas",
    score: 4.19,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p11",
    projectName: "Signal Grove",
    teamName: "Fresh Air",
    track: "Climate",
    description: "Forestry grant navigator that packages local land restoration opportunities for municipalities.",
    videoUrl: "https://example.com/video/signal-grove",
    repoUrl: "https://github.com/example/signal-grove",
    score: 4.17,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
  {
    id: "p12",
    projectName: "Boardlight",
    teamName: "Moonline",
    track: "Education",
    description: "Student support portal for counselors tracking workload, attendance, and intervention follow-up.",
    videoUrl: "https://example.com/video/boardlight",
    repoUrl: "https://github.com/example/boardlight",
    score: 4.09,
    status: "Ready",
    assignedJudgeIds: [],
    manualAdjustment: 0,
    tieBreakerNote: "",
  },
];

const csvSeed: CsvMappingRow[] = [
  { source: "submission_title", sample: "Atlas Relay", target: "project_name", required: true },
  { source: "team_handle", sample: "Northstar Labs", target: "team_name", required: true },
  { source: "demo_video", sample: "https://example.com/video/atlas-relay", target: "video_url", required: true },
  { source: "repo", sample: "https://github.com/example/atlas-relay", target: "repo_url", required: false },
  { source: "track_bucket", sample: "Developer Tools", target: "track", required: true },
  { source: "one_line_pitch", sample: "Incident remediation copilot", target: "description", required: true },
  { source: "screening_score", sample: "4.82", target: "score", required: false },
];

const fieldOptions: Array<{ value: CsvMappingTarget; label: string }> = [
  { value: "project_name", label: "Project name" },
  { value: "team_name", label: "Team name" },
  { value: "description", label: "Description" },
  { value: "video_url", label: "Video URL" },
  { value: "repo_url", label: "Repository URL" },
  { value: "track", label: "Track" },
  { value: "score", label: "Pre-score" },
  { value: "ignore", label: "Ignore" },
];

const initialPolicy: AssignmentPolicy = {
  scope: "topN",
  topN: 6,
  minimumJudges: 2,
  preferTrackJudges: true,
  keepExistingAssignments: false,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getEffectiveScore(project: ProjectRecord) {
  return project.score + project.manualAdjustment;
}

function getRankedProjects(projects: ProjectRecord[]) {
  return [...projects].sort((left, right) => {
    const delta = getEffectiveScore(right) - getEffectiveScore(left);
    if (Math.abs(delta) > 0.0001) {
      return delta;
    }

    return left.projectName.localeCompare(right.projectName);
  });
}

function buildAssignmentPlan(
  projects: ProjectRecord[],
  judges: JudgeRecord[],
  policy: AssignmentPolicy,
): PlanPreview {
  const rankedProjects = getRankedProjects(projects);
  const targetCount =
    policy.scope === "all"
      ? rankedProjects.length
      : policy.scope === "top20"
        ? Math.min(20, rankedProjects.length)
        : Math.min(policy.topN, rankedProjects.length);

  const selectedProjects = rankedProjects.slice(0, targetCount);
  const judgeLoads: Record<string, number> = Object.fromEntries(
    judges.map((judge) => [judge.id, policy.keepExistingAssignments ? judge.currentAssignments : 0]),
  );
  const assignmentMap: Record<string, string[]> = {};

  selectedProjects.forEach((project) => {
    const current = policy.keepExistingAssignments ? [...project.assignedJudgeIds] : [];
    const needed = Math.max(policy.minimumJudges - current.length, 0);
    const judgePool = [...judges].sort((left, right) => {
      const leftTrackMatch = Number(left.track === project.track);
      const rightTrackMatch = Number(right.track === project.track);
      if (policy.preferTrackJudges && leftTrackMatch !== rightTrackMatch) {
        return rightTrackMatch - leftTrackMatch;
      }

      return judgeLoads[left.id] - judgeLoads[right.id];
    });

    for (const judge of judgePool) {
      if (current.length >= policy.minimumJudges) {
        break;
      }

      if (current.includes(judge.id)) {
        continue;
      }

      if (judgeLoads[judge.id] >= judge.capacity) {
        continue;
      }

      current.push(judge.id);
      judgeLoads[judge.id] += 1;
    }

    assignmentMap[project.id] = current;
  });

  return {
    selectedProjectIds: selectedProjects.map((project) => project.id),
    assignmentMap,
    judgeLoads,
  };
}

export default function AdminPortal({ organizerName, initialConfig }: AdminPortalProps) {
  const [events, setEvents] = useState<EventRecord[]>(eventSeed(initialConfig));
  const [selectedEventId, setSelectedEventId] = useState("event-main");
  const [eventDraft, setEventDraft] = useState({
    name: "",
    format: "hybrid",
    audience: "invited",
    startDate: "",
    endDate: "",
  });
  const [csvMappings, setCsvMappings] = useState<CsvMappingRow[]>(csvSeed);
  const [projects, setProjects] = useState<ProjectRecord[]>(projectSeed);
  const [judges, setJudges] = useState<JudgeRecord[]>(judgeSeed);
  const [policy, setPolicy] = useState<AssignmentPolicy>(initialPolicy);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [ingestStatus, setIngestStatus] = useState("Last import normalized 12 rows with 2 held for review.");

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];
  const rankedProjects = useMemo(() => getRankedProjects(projects), [projects]);
  const assignmentPreview = useMemo(
    () => buildAssignmentPlan(projects, judges, policy),
    [projects, judges, policy],
  );

  const catalogProjects = rankedProjects.filter((project) => {
    const query = catalogQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [project.projectName, project.teamName, project.track, project.description]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const mappedCommonFields = csvMappings.filter((row) => row.target !== "ignore").length;
  const missingRequiredMappings = csvMappings.filter(
    (row) => row.required && row.target === "ignore",
  ).length;
  const readyProjects = projects.filter((project) => project.status === "Ready").length;
  const fullyCoveredProjects = projects.filter(
    (project) => project.assignedJudgeIds.length >= policy.minimumJudges,
  ).length;

  function createEvent() {
    if (!eventDraft.name.trim()) {
      return;
    }

    const nextEvent: EventRecord = {
      id: `event-${Date.now()}`,
      name: eventDraft.name.trim(),
      slug: slugify(eventDraft.name),
      format: eventDraft.format,
      audience: eventDraft.audience,
      status: "Draft",
      startDate: eventDraft.startDate,
      endDate: eventDraft.endDate,
      projectCount: 0,
      judgeCount: 0,
    };

    setEvents((current) => [nextEvent, ...current]);
    setSelectedEventId(nextEvent.id);
    setEventDraft({
      name: "",
      format: "hybrid",
      audience: "invited",
      startDate: "",
      endDate: "",
    });
  }

  function updateMapping(index: number, target: CsvMappingTarget) {
    setCsvMappings((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, target } : row)),
    );
  }

  function runNormalization() {
    const requiredTargets = new Set(
      csvMappings.filter((row) => row.required && row.target !== "ignore").map((row) => row.target),
    );
    const hasCoreFields =
      requiredTargets.has("project_name") &&
      requiredTargets.has("team_name") &&
      requiredTargets.has("description") &&
      requiredTargets.has("video_url");

    setProjects((current) =>
      current.map((project) => ({
        ...project,
        status: hasCoreFields
          ? project.videoUrl
            ? project.status === "Needs review"
              ? "Needs review"
              : "Ready"
            : "Missing video"
          : "Needs review",
      })),
    );

    setIngestStatus(
      hasCoreFields
        ? "Normalization preview refreshed. Common fields are mapped and project cards are ready to review."
        : "Normalization blocked. Map project name, team, description, and video before publishing the import.",
    );
  }

  function applyAssignmentRules() {
    const plan = buildAssignmentPlan(projects, judges, policy);

    setProjects((current) =>
      current.map((project) =>
        plan.selectedProjectIds.includes(project.id)
          ? { ...project, assignedJudgeIds: plan.assignmentMap[project.id] ?? project.assignedJudgeIds }
          : project,
      ),
    );

    setJudges((current) =>
      current.map((judge) => ({
        ...judge,
        currentAssignments: plan.judgeLoads[judge.id] ?? judge.currentAssignments,
      })),
    );
  }

  function nudgeRank(projectId: string, delta: number) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              manualAdjustment: Math.max(-0.2, Math.min(0.2, Number((project.manualAdjustment + delta).toFixed(2)))),
            }
          : project,
      ),
    );
  }

  function updateTieBreakerNote(projectId: string, note: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, tieBreakerNote: note } : project,
      ),
    );
  }

  return (
    <div className="admin-portal">
      <div className="portal-shell">
        <aside className="portal-rail">
          <div className="rail-block">
            <p className="eyebrow">Administrator portal</p>
            <h2>Operations desk</h2>
            <p className="rail-copy">
              Create events, normalize custom project imports, assign judges, and control the final ranking.
            </p>
            <div className="rail-chip">
              <span className="status-indicator" />
              Organizer verified: {organizerName}
            </div>
          </div>

          <div className="rail-block">
            <p className="eyebrow">Event roster</p>
            <div className="event-list">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`event-card ${event.id === selectedEventId ? "active" : ""}`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <strong>{event.name}</strong>
                  <span>
                    {event.status} · {event.projectCount} projects
                  </span>
                  <small>
                    {formatDate(event.startDate)} to {formatDate(event.endDate)}
                  </small>
                </button>
              ))}
            </div>
          </div>

          <div className="rail-block rail-summary">
            <p className="eyebrow">Live KPIs</p>
            <div className="summary-stat">
              <span>Mapped fields</span>
              <strong>{mappedCommonFields} / {csvMappings.length}</strong>
            </div>
            <div className="summary-stat">
              <span>Ready projects</span>
              <strong>{readyProjects} / {projects.length}</strong>
            </div>
            <div className="summary-stat">
              <span>Coverage</span>
              <strong>{fullyCoveredProjects} / {projects.length}</strong>
            </div>
          </div>
        </aside>

        <main className="portal-main">
          <section className="portal-hero">
            <div>
              <p className="eyebrow">Current event</p>
              <h1>{selectedEvent.name}</h1>
              <p className="hero-copy">
                The administrator portal is split into five operational jobs: create the event,
                ingest and normalize project data, review the catalog, assign judges, and finalize rank.
              </p>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <span>Window</span>
                <strong>{formatDate(selectedEvent.startDate)}</strong>
                <small>{selectedEvent.format}</small>
              </div>
              <div className="metric-card">
                <span>Audience</span>
                <strong>{selectedEvent.audience}</strong>
                <small>{selectedEvent.status}</small>
              </div>
              <div className="metric-card">
                <span>Judges live</span>
                <strong>{judges.length}</strong>
                <small>{policy.minimumJudges} minimum per project</small>
              </div>
            </div>
          </section>

          <section className="portal-grid">
            <article className="portal-card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">1. Event creation</p>
                  <h3>Create or stage a new hackathon</h3>
                </div>
                <span className="tag">General configuration</span>
              </div>
              <div className="form-grid">
                <label>
                  <span>Event name</span>
                  <input
                    value={eventDraft.name}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Summer Builders Invitational"
                  />
                </label>
                <label>
                  <span>Format</span>
                  <select
                    value={eventDraft.format}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, format: event.target.value }))
                    }
                  >
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </label>
                <label>
                  <span>Audience</span>
                  <select
                    value={eventDraft.audience}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, audience: event.target.value }))
                    }
                  >
                    <option value="invited">Invited</option>
                    <option value="campus">Campus</option>
                    <option value="open">Open</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>
                <label>
                  <span>Start date</span>
                  <input
                    type="date"
                    value={eventDraft.startDate}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, startDate: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>End date</span>
                  <input
                    type="date"
                    value={eventDraft.endDate}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, endDate: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="action-row">
                <button className="portal-button portal-button-primary" onClick={createEvent} type="button">
                  Create event
                </button>
                <div className="inline-note">
                  New events appear in the roster immediately and inherit this portal structure.
                </div>
              </div>
            </article>

            <article className="portal-card portal-card-wide">
              <div className="card-header">
                <div>
                  <p className="eyebrow">2. CSV ingestion</p>
                  <h3>Map any incoming submission schema into common project fields</h3>
                </div>
                <span className="tag">Custom structure supported</span>
              </div>
              <div className="ingest-banner">{ingestStatus}</div>
              <div className="mapping-table">
                {csvMappings.map((row, index) => (
                  <div className="mapping-row" key={row.source}>
                    <div>
                      <strong>{row.source}</strong>
                      <span>{row.sample}</span>
                    </div>
                    <select
                      value={row.target}
                      onChange={(event) => updateMapping(index, event.target.value as CsvMappingTarget)}
                    >
                      {fieldOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className={`required-flag ${row.required ? "required" : ""}`}>
                      {row.required ? "Required" : "Optional"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="action-row">
                <button className="portal-button portal-button-primary" onClick={runNormalization} type="button">
                  Normalize preview
                </button>
                <div className="inline-note">
                  {missingRequiredMappings === 0
                    ? "All required fields are mapped."
                    : `${missingRequiredMappings} required field mappings are still missing.`}
                </div>
              </div>
            </article>

            <article className="portal-card portal-card-wide">
              <div className="card-header">
                <div>
                  <p className="eyebrow">3. Project catalog</p>
                  <h3>Review imported projects with embedded common fields</h3>
                </div>
                <span className="tag">{catalogProjects.length} visible</span>
              </div>
              <div className="catalog-toolbar">
                <input
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder="Search by project, team, track, or description"
                />
                <div className="inline-note">
                  Cards embed project name, video, description, repo, status, and assignment coverage.
                </div>
              </div>
              <div className="project-grid">
                {catalogProjects.map((project, index) => (
                  <article className="project-card" key={project.id}>
                    <div className="project-card-top">
                      <div>
                        <span className="rank-badge">#{index + 1}</span>
                        <h4>{project.projectName}</h4>
                        <p>{project.teamName}</p>
                      </div>
                      <span className={`status-badge status-${project.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="project-description">{project.description}</p>
                    <div className="project-meta">
                      <span>{project.track}</span>
                      <span>{project.videoUrl ? "Video linked" : "Video missing"}</span>
                      <span>{project.assignedJudgeIds.length} judges assigned</span>
                    </div>
                    <div className="link-strip">
                      <a href={project.videoUrl || "#"} target="_blank" rel="noreferrer">
                        Demo
                      </a>
                      <a href={project.repoUrl || "#"} target="_blank" rel="noreferrer">
                        Repo
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="portal-card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">4. Judge assignment rules</p>
                  <h3>Apply routing logic instead of manual spreadsheet work</h3>
                </div>
                <span className="tag">Rule-driven</span>
              </div>
              <div className="rule-stack">
                <label>
                  <span>Project scope</span>
                  <select
                    value={policy.scope}
                    onChange={(event) =>
                      setPolicy((current) => ({
                        ...current,
                        scope: event.target.value as AssignmentPolicy["scope"],
                      }))
                    }
                  >
                    <option value="all">All projects</option>
                    <option value="top20">Top 20 projects</option>
                    <option value="topN">Top N projects</option>
                  </select>
                </label>
                <label>
                  <span>Top N size</span>
                  <input
                    type="number"
                    min={1}
                    max={projects.length}
                    value={policy.topN}
                    onChange={(event) =>
                      setPolicy((current) => ({
                        ...current,
                        topN: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Minimum judges per project</span>
                  <input
                    type="number"
                    min={1}
                    max={judges.length}
                    value={policy.minimumJudges}
                    onChange={(event) =>
                      setPolicy((current) => ({
                        ...current,
                        minimumJudges: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="switch-row">
                  <input
                    checked={policy.preferTrackJudges}
                    onChange={(event) =>
                      setPolicy((current) => ({
                        ...current,
                        preferTrackJudges: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>Prefer track-matched judges</span>
                </label>
                <label className="switch-row">
                  <input
                    checked={policy.keepExistingAssignments}
                    onChange={(event) =>
                      setPolicy((current) => ({
                        ...current,
                        keepExistingAssignments: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>Keep existing assignments</span>
                </label>
              </div>
              <div className="action-row">
                <button className="portal-button portal-button-primary" onClick={applyAssignmentRules} type="button">
                  Apply rules
                </button>
                <div className="inline-note">
                  {assignmentPreview.selectedProjectIds.length} projects are in scope for the next assignment pass.
                </div>
              </div>
              <div className="preview-list">
                {assignmentPreview.selectedProjectIds.slice(0, 5).map((projectId) => {
                  const project = projects.find((item) => item.id === projectId);
                  const names =
                    assignmentPreview.assignmentMap[projectId]
                      ?.map((judgeId) => judges.find((judge) => judge.id === judgeId)?.name)
                      .filter(Boolean)
                      .join(", ") || "No judges assigned";

                  return (
                    <div className="preview-row" key={projectId}>
                      <strong>{project?.projectName}</strong>
                      <span>{names}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="portal-card portal-card-wide">
              <div className="card-header">
                <div>
                  <p className="eyebrow">5. Ranking desk</p>
                  <h3>View projects by rank and resolve ties manually when needed</h3>
                </div>
                <span className="tag">Manual tiebreaks enabled</span>
              </div>
              <div className="ranking-list">
                {rankedProjects.map((project, index) => (
                  <article className="ranking-row" key={project.id}>
                    <div className="ranking-main">
                      <span className="rank-badge">#{index + 1}</span>
                      <div>
                        <strong>{project.projectName}</strong>
                        <p>
                          {project.teamName} · {project.track} · base {project.score.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="ranking-controls">
                      <div className="score-stack">
                        <strong>{getEffectiveScore(project).toFixed(2)}</strong>
                        <span>
                          tiebreak {project.manualAdjustment >= 0 ? "+" : ""}
                          {project.manualAdjustment.toFixed(2)}
                        </span>
                      </div>
                      <div className="mini-actions">
                        <button onClick={() => nudgeRank(project.id, 0.01)} type="button">
                          Lift
                        </button>
                        <button onClick={() => nudgeRank(project.id, -0.01)} type="button">
                          Drop
                        </button>
                      </div>
                    </div>
                    <label className="note-field">
                      <span>Tiebreak note</span>
                      <input
                        value={project.tieBreakerNote}
                        onChange={(event) => updateTieBreakerNote(project.id, event.target.value)}
                        placeholder="Reason for manual adjustment"
                      />
                    </label>
                  </article>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>

      <style jsx>{`
        .admin-portal {
          min-height: 100vh;
        }

        .portal-shell {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .portal-rail {
          position: sticky;
          top: 24px;
          display: grid;
          gap: 18px;
        }

        .rail-block,
        .portal-hero,
        .portal-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #d7dee7;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 40px rgba(17, 24, 39, 0.06);
        }

        .rail-block::before,
        .portal-hero::before,
        .portal-card::before {
          content: "";
          position: absolute;
          inset: 18px auto 18px 0;
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, #1f4ed8, #0f766e);
        }

        .rail-block,
        .portal-card {
          padding: 22px;
        }

        .portal-main {
          display: grid;
          gap: 20px;
        }

        .portal-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(0, 1fr));
          gap: 18px;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(31, 78, 216, 0.08), transparent 28%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(238, 241, 244, 0.92));
        }

        .hero-copy,
        .rail-copy,
        .project-description,
        .inline-note,
        .preview-row span,
        .event-card span,
        .event-card small,
        .mapping-row span,
        .project-meta span,
        .ranking-main p,
        .score-stack span {
          margin: 0;
          color: #5b6472;
          line-height: 1.55;
        }

        .hero-metrics {
          display: contents;
        }

        .metric-card {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #d7dee7;
          padding: 18px;
        }

        .metric-card span,
        .summary-stat span,
        .note-field span,
        .mapping-row strong + span {
          display: block;
          font-size: 0.82rem;
        }

        .metric-card strong,
        .summary-stat strong,
        .score-stack strong {
          display: block;
          margin: 8px 0 4px;
          font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, monospace;
          font-size: 1.45rem;
        }

        .rail-chip,
        .tag,
        .required-flag,
        .status-badge,
        .status-indicator,
        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .rail-chip,
        .tag,
        .status-badge {
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid #d7dee7;
          background: #eef4ff;
          color: #1f4ed8;
          font-size: 0.84rem;
        }

        .status-indicator {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #15803d;
        }

        .event-list,
        .project-grid,
        .preview-list,
        .ranking-list {
          display: grid;
          gap: 12px;
        }

        .event-card,
        .portal-button,
        .mini-actions button,
        .link-strip a {
          transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
        }

        .event-card {
          width: 100%;
          text-align: left;
          border: 1px solid #d7dee7;
          border-radius: 16px;
          background: #fff;
          padding: 16px;
          cursor: pointer;
        }

        .event-card.active {
          border-color: rgba(31, 78, 216, 0.45);
          box-shadow: 0 10px 24px rgba(31, 78, 216, 0.12);
          background: #f6f9ff;
        }

        .summary-stat {
          padding: 14px 0;
          border-top: 1px solid #e6ebf0;
        }

        .summary-stat:first-of-type {
          border-top: 0;
        }

        .portal-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 20px;
        }

        .portal-card {
          grid-column: span 4;
        }

        .portal-card-wide {
          grid-column: span 8;
        }

        .card-header,
        .project-card-top,
        .ranking-row,
        .ranking-main,
        .ranking-controls {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .form-grid,
        .rule-stack {
          display: grid;
          gap: 14px;
        }

        .form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .rule-stack label,
        .form-grid label,
        .note-field {
          display: grid;
          gap: 8px;
        }

        .rule-stack span,
        .form-grid span,
        .note-field span {
          font-size: 0.88rem;
          color: #111827;
        }

        .ingest-banner {
          margin-bottom: 16px;
          padding: 14px 16px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #d7dee7;
          color: #5b6472;
        }

        .mapping-table {
          display: grid;
          gap: 10px;
        }

        .mapping-row {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(180px, 0.9fr) auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e0e7ef;
        }

        .required-flag {
          padding: 8px 10px;
          border-radius: 999px;
          background: #eef1f4;
          color: #5b6472;
          font-size: 0.78rem;
        }

        .required-flag.required {
          background: #fff4e8;
          color: #b45309;
        }

        .action-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-top: 18px;
        }

        .portal-button {
          border: 1px solid transparent;
          border-radius: 16px;
          min-height: 46px;
          padding: 0 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .portal-button-primary {
          background: #1f4ed8;
          color: white;
        }

        .catalog-toolbar {
          display: grid;
          gap: 12px;
          margin-bottom: 16px;
        }

        .project-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .project-card {
          padding: 18px;
          border-radius: 18px;
          border: 1px solid #dfe6ee;
          background: #fbfcfd;
        }

        .project-card h4 {
          margin-top: 10px;
          font-size: 1.35rem;
        }

        .rank-badge {
          min-width: 42px;
          padding: 8px 10px;
          border-radius: 999px;
          background: #111827;
          color: white;
          font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, monospace;
          font-size: 0.78rem;
        }

        .project-meta,
        .link-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .project-meta span,
        .link-strip a {
          padding: 8px 10px;
          border-radius: 999px;
          background: #eef1f4;
          font-size: 0.8rem;
        }

        .link-strip a {
          color: #1f4ed8;
        }

        .status-ready {
          background: #ecfdf3;
          color: #15803d;
        }

        .status-missing-video {
          background: #fff4e8;
          color: #b45309;
        }

        .status-needs-review {
          background: #fff0f0;
          color: #b42318;
        }

        .switch-row {
          display: flex !important;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e0e7ef;
        }

        .switch-row input {
          width: auto;
        }

        .preview-row,
        .ranking-row {
          padding: 14px 16px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e0e7ef;
        }

        .mini-actions {
          display: flex;
          gap: 8px;
        }

        .mini-actions button {
          border: 1px solid #d7dee7;
          border-radius: 12px;
          background: white;
          padding: 8px 10px;
          cursor: pointer;
        }

        .mini-actions button:hover,
        .event-card:hover,
        .link-strip a:hover,
        .portal-button:hover {
          border-color: rgba(31, 78, 216, 0.35);
          box-shadow: 0 8px 18px rgba(17, 24, 39, 0.08);
        }

        .score-stack {
          text-align: right;
        }

        .note-field {
          min-width: 240px;
        }

        @media (max-width: 1200px) {
          .portal-shell {
            grid-template-columns: 1fr;
          }

          .portal-rail {
            position: static;
          }

          .portal-hero {
            grid-template-columns: 1fr;
          }

          .portal-card,
          .portal-card-wide {
            grid-column: span 12;
          }
        }

        @media (max-width: 720px) {
          .portal-grid,
          .form-grid,
          .project-grid,
          .mapping-row {
            grid-template-columns: 1fr;
          }

          .action-row,
          .card-header,
          .ranking-row,
          .ranking-main,
          .ranking-controls,
          .project-card-top {
            display: grid;
          }

          .note-field {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
