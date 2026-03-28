import Link from "next/link";

import {
  createEventAction,
  createInviteAction,
  finalizeLeaderboardAction,
  revokeInviteAction,
  saveAssignmentPolicyAction,
  updateEventAction,
  updateProjectReviewAction,
} from "@/app/admin/actions";
import CsvImportPanel from "@/components/csv-import-panel";
import type { LeaderboardEntry } from "@/lib/server/types";

type Props = {
  queryState: {
    saved?: string;
    inviteCode?: string;
  };
  events: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
  selectedEvent: {
    id: string;
    name: string;
    slug: string;
    hostOrganization: string;
    format: string;
    audience: string;
    status: string;
    timezone: string;
    startDate: string;
    endDate: string;
    location: string;
    tracks: string[];
    organizerGoal: string;
    judgeCount: number;
  } | null;
  invites: Array<{
    id: string;
    email: string;
    label: string;
    track: string | null;
    status: string;
    redeemedAt: Date | null;
  }>;
  judges: Array<{
    id: string;
    name: string;
    email: string;
    track: string | null;
    assignmentCapacity: number;
    assignmentCount: number;
  }>;
  projects: Array<{
    id: string;
    projectName: string;
    teamName: string;
    track: string | null;
    status: string;
    description: string;
    screeningScore: number | null;
    manualAdjustment: number;
    tieBreakerNote: string;
    repoUrl: string;
    demoUrl: string;
    submissionUrl: string;
    assignedJudges: string[];
    submittedScorecards: number;
  }>;
  liveLeaderboard: LeaderboardEntry[];
  publishedLeaderboard: {
    id: string;
    createdAt: Date;
    entries: LeaderboardEntry[];
  } | null;
  assignmentPolicy: {
    scope: "all" | "top20" | "topN";
    topN: number;
    minimumJudges: number;
    preferTrackJudges: boolean;
    keepExistingAssignments: boolean;
  };
};

function saveMessage(saved?: string) {
  switch (saved) {
    case "event":
      return "Event saved.";
    case "invite":
      return "Invite updated.";
    case "assignments":
      return "Assignment plan persisted.";
    case "project":
      return "Leaderboard note saved.";
    case "leaderboard":
      return "Leaderboard published.";
    default:
      return null;
  }
}

export default function AdminDashboard({
  queryState,
  events,
  selectedEvent,
  invites,
  judges,
  projects,
  liveLeaderboard,
  publishedLeaderboard,
  assignmentPolicy,
}: Props) {
  const feedback = saveMessage(queryState.saved);

  if (!selectedEvent) {
    return (
      <div className="card">
        <h2>No events yet</h2>
        <p>Create an event to start configuring judging operations.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Events</p>
            <h2>Operations desk</h2>
          </div>
          <div className="utility-cluster">
            {events.map((event) => (
              <Link
                className={`utility-pill ${event.id === selectedEvent.id ? "utility-pill-strong" : ""}`}
                href={`/admin?eventId=${event.id}`}
                key={event.id}
              >
                {event.name}
              </Link>
            ))}
          </div>
        </div>
        {feedback ? <p className="inline-note">{feedback}</p> : null}
        {queryState.inviteCode ? (
          <p className="inline-note">
            New invite code: <code>{queryState.inviteCode}</code>
          </p>
        ) : null}
      </section>

      <section className="admin-grid-two">
        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Current event</p>
              <h3>{selectedEvent.name}</h3>
            </div>
            <span className="badge">{selectedEvent.status}</span>
          </div>
          <form action={updateEventAction} className="stack-form">
            <input name="eventId" type="hidden" value={selectedEvent.id} />
            <label>
              <span>Name</span>
              <input defaultValue={selectedEvent.name} name="name" required type="text" />
            </label>
            <label>
              <span>Host organization</span>
              <input defaultValue={selectedEvent.hostOrganization} name="hostOrganization" required type="text" />
            </label>
            <label>
              <span>Format</span>
              <select defaultValue={selectedEvent.format} name="format">
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </label>
            <label>
              <span>Audience</span>
              <select defaultValue={selectedEvent.audience} name="audience">
                <option value="invited">Invited</option>
                <option value="application">Application</option>
                <option value="public">Public</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={selectedEvent.status} name="status">
                <option value="DRAFT">Draft</option>
                <option value="OPEN_INTAKE">Open intake</option>
                <option value="JUDGING_LIVE">Judging live</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
            <label>
              <span>Timezone</span>
              <input defaultValue={selectedEvent.timezone} name="timezone" type="text" />
            </label>
            <label>
              <span>Start date</span>
              <input defaultValue={selectedEvent.startDate} name="startDate" required type="date" />
            </label>
            <label>
              <span>End date</span>
              <input defaultValue={selectedEvent.endDate} name="endDate" required type="date" />
            </label>
            <label>
              <span>Location</span>
              <input defaultValue={selectedEvent.location} name="location" required type="text" />
            </label>
            <label>
              <span>Tracks</span>
              <input defaultValue={selectedEvent.tracks.join(", ")} name="tracks" type="text" />
            </label>
            <label>
              <span>Judge count target</span>
              <input defaultValue={selectedEvent.judgeCount} min="1" name="judgeCount" type="number" />
            </label>
            <label>
              <span>Organizer goal</span>
              <textarea defaultValue={selectedEvent.organizerGoal} name="organizerGoal" rows={4} />
            </label>
            <button className="button button-primary" type="submit">
              Save event
            </button>
          </form>
        </div>

        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Create event</p>
              <h3>Stage a new hackathon</h3>
            </div>
          </div>
          <form action={createEventAction} className="stack-form">
            <label>
              <span>Name</span>
              <input name="name" placeholder="Campus Sprint Weekend" required type="text" />
            </label>
            <label>
              <span>Host organization</span>
              <input defaultValue="Signal Labs" name="hostOrganization" type="text" />
            </label>
            <label>
              <span>Format</span>
              <select defaultValue="hybrid" name="format">
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </label>
            <label>
              <span>Audience</span>
              <select defaultValue="invited" name="audience">
                <option value="invited">Invited</option>
                <option value="application">Application</option>
                <option value="public">Public</option>
              </select>
            </label>
            <label>
              <span>Timezone</span>
              <input defaultValue="America/Los_Angeles" name="timezone" type="text" />
            </label>
            <label>
              <span>Start date</span>
              <input name="startDate" required type="date" />
            </label>
            <label>
              <span>End date</span>
              <input name="endDate" required type="date" />
            </label>
            <label>
              <span>Location</span>
              <input defaultValue="San Francisco, CA" name="location" type="text" />
            </label>
            <label>
              <span>Tracks</span>
              <input defaultValue="Developer Tools, Climate, Healthcare" name="tracks" type="text" />
            </label>
            <label>
              <span>Organizer goal</span>
              <textarea name="organizerGoal" rows={3} />
            </label>
            <button className="button button-secondary" type="submit">
              Create event
            </button>
          </form>
        </div>
      </section>

      <CsvImportPanel eventId={selectedEvent.id} />

      <section className="admin-grid-two">
        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Invite management</p>
              <h3>Judge access</h3>
            </div>
          </div>
          <form action={createInviteAction} className="stack-form">
            <input name="eventId" type="hidden" value={selectedEvent.id} />
            <label>
              <span>Email</span>
              <input name="email" placeholder="judge@company.com" required type="email" />
            </label>
            <label>
              <span>Label</span>
              <input name="label" placeholder="Climate specialist" type="text" />
            </label>
            <label>
              <span>Track</span>
              <input name="track" placeholder="Climate" type="text" />
            </label>
            <label>
              <span>Optional invite code</span>
              <input name="code" placeholder="JUDGE-CUSTOM-01" type="text" />
            </label>
            <button className="button button-primary" type="submit">
              Create invite
            </button>
          </form>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Label</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.email}</td>
                    <td>{invite.label}</td>
                    <td>{invite.track ?? "General"}</td>
                    <td>{invite.status}</td>
                    <td>
                      {invite.status === "SENT" ? (
                        <form action={revokeInviteAction}>
                          <input name="eventId" type="hidden" value={selectedEvent.id} />
                          <input name="inviteId" type="hidden" value={invite.id} />
                          <button className="button button-ghost" type="submit">
                            Revoke
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Judge roster</p>
              <h3>Capacity and load</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Track</th>
                  <th>Capacity</th>
                  <th>Assignments</th>
                </tr>
              </thead>
              <tbody>
                {judges.map((judge) => (
                  <tr key={judge.id}>
                    <td>
                      <strong>{judge.name}</strong>
                      <div className="subtle-text">{judge.email}</div>
                    </td>
                    <td>{judge.track ?? "General"}</td>
                    <td>{judge.assignmentCapacity}</td>
                    <td>{judge.assignmentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Assignments</p>
            <h3>Persist judge routing</h3>
          </div>
        </div>
        <form action={saveAssignmentPolicyAction} className="inline-form-grid">
          <input name="eventId" type="hidden" value={selectedEvent.id} />
          <label>
            <span>Scope</span>
            <select defaultValue={assignmentPolicy.scope} name="scope">
              <option value="all">All projects</option>
              <option value="top20">Top 20</option>
              <option value="topN">Top N</option>
            </select>
          </label>
          <label>
            <span>Top N</span>
            <input defaultValue={assignmentPolicy.topN} min="1" name="topN" type="number" />
          </label>
          <label>
            <span>Minimum judges</span>
            <input defaultValue={assignmentPolicy.minimumJudges} min="1" name="minimumJudges" type="number" />
          </label>
          <label className="checkbox-row">
            <input defaultChecked={assignmentPolicy.preferTrackJudges} name="preferTrackJudges" type="checkbox" />
            <span>Prefer track-matched judges</span>
          </label>
          <label className="checkbox-row">
            <input defaultChecked={assignmentPolicy.keepExistingAssignments} name="keepExistingAssignments" type="checkbox" />
            <span>Keep existing assignments</span>
          </label>
          <button className="button button-primary" type="submit">
            Save assignment plan
          </button>
        </form>
      </section>

      <section className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Projects</p>
            <h3>Catalog, assignments, and leaderboard controls</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Track</th>
                <th>Status</th>
                <th>Assigned judges</th>
                <th>Submitted scorecards</th>
                <th>Adjustment</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.projectName}</strong>
                    <div className="subtle-text">{project.teamName}</div>
                  </td>
                  <td>{project.track ?? "General"}</td>
                  <td>{project.status}</td>
                  <td>{project.assignedJudges.join(", ") || "Unassigned"}</td>
                  <td>{project.submittedScorecards}</td>
                  <td>
                    <form action={updateProjectReviewAction} className="stack-form compact-form">
                      <input name="eventId" type="hidden" value={selectedEvent.id} />
                      <input name="projectId" type="hidden" value={project.id} />
                      <input
                        defaultValue={project.manualAdjustment}
                        name="manualAdjustment"
                        step="0.01"
                        type="number"
                      />
                      <textarea defaultValue={project.tieBreakerNote} name="tieBreakerNote" rows={2} />
                      <button className="button button-ghost" type="submit">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-grid-two">
        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Live leaderboard</p>
              <h3>Computed from submitted scorecards</h3>
            </div>
            <form action={finalizeLeaderboardAction}>
              <input name="eventId" type="hidden" value={selectedEvent.id} />
              <button className="button button-primary" type="submit">
                Publish snapshot
              </button>
            </form>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Project</th>
                  <th>Submitted</th>
                  <th>Average</th>
                  <th>Adjustment</th>
                  <th>Final</th>
                </tr>
              </thead>
              <tbody>
                {liveLeaderboard.map((entry) => (
                  <tr key={entry.projectId}>
                    <td>{entry.rank}</td>
                    <td>
                      <strong>{entry.projectName}</strong>
                      <div className="subtle-text">{entry.teamName}</div>
                    </td>
                    <td>{entry.submittedScorecards}</td>
                    <td>{entry.averageScore.toFixed(2)}</td>
                    <td>{entry.manualAdjustment.toFixed(2)}</td>
                    <td>{entry.finalScore.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Published snapshot</p>
              <h3>{publishedLeaderboard ? "Latest published leaderboard" : "No published snapshot yet"}</h3>
            </div>
          </div>
          {publishedLeaderboard ? (
            <>
              <p className="subtle-text">
                Published at {publishedLeaderboard.createdAt.toLocaleString()}
              </p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Project</th>
                      <th>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishedLeaderboard.entries.map((entry) => (
                      <tr key={`${publishedLeaderboard.id}-${entry.projectId}`}>
                        <td>{entry.rank}</td>
                        <td>
                          <strong>{entry.projectName}</strong>
                          <div className="subtle-text">{entry.teamName}</div>
                        </td>
                        <td>{entry.finalScore.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="subtle-text">Publishing freezes a leaderboard snapshot for reference and export.</p>
          )}
        </div>
      </section>
    </div>
  );
}
