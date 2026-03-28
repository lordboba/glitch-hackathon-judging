import { updateProjectReviewAction } from "@/app/admin/actions";
import { getEventProjects } from "@/lib/server/events";
import { computeLiveLeaderboard } from "@/lib/server/leaderboard";

export default async function RankingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "project";
  const [leaderboard, projects] = await Promise.all([
    computeLiveLeaderboard(eventId),
    getEventProjects(eventId),
  ]);

  return (
    <div className="admin-dashboard">
      <div>
        <p className="eyebrow">Rankings</p>
        <h2>Live leaderboard</h2>
      </div>

      {saved ? <p className="inline-note">Project review saved.</p> : null}

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h3>Computed from submitted scorecards</h3>
          </div>
          <span className="badge">{leaderboard.length} ranked</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Project</th>
                <th>Scorecards</th>
                <th>Average</th>
                <th>Adjustment</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.projectId}>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                    {entry.rank}
                  </td>
                  <td>
                    <strong>{entry.projectName}</strong>
                    <div className="subtle-text">{entry.teamName}</div>
                  </td>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {entry.submittedScorecards}
                  </td>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {entry.averageScore.toFixed(2)}
                  </td>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {entry.manualAdjustment.toFixed(2)}
                  </td>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: "#2563eb" }}>
                    {entry.finalScore.toFixed(2)}
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
            <p className="eyebrow">Projects</p>
            <h3>Manual adjustments & tiebreaker notes</h3>
          </div>
          <span className="badge">{projects.length} projects</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Track</th>
                <th>Status</th>
                <th>Judges</th>
                <th>Scorecards</th>
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
                  <td><span className="badge">{project.status}</span></td>
                  <td>{project.assignedJudges.join(", ") || "Unassigned"}</td>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {project.submittedScorecards}
                  </td>
                  <td>
                    <form action={updateProjectReviewAction} className="stack-form compact-form">
                      <input name="eventId" type="hidden" value={eventId} />
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
      </div>
    </div>
  );
}
