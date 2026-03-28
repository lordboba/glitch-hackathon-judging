import { finalizeLeaderboardAction } from "@/app/admin/actions";
import { getEventConfig } from "@/lib/server/events";
import { computeLiveLeaderboard, getPublishedLeaderboard } from "@/lib/server/leaderboard";

export default async function PublishPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "leaderboard";
  const [event, liveLeaderboard, publishedLeaderboard] = await Promise.all([
    getEventConfig(eventId),
    computeLiveLeaderboard(eventId),
    getPublishedLeaderboard(eventId),
  ]);

  if (!event) return null;

  return (
    <div className="admin-dashboard">
      <div>
        <p className="eyebrow">Publish</p>
        <h2>Review & publish</h2>
      </div>

      {saved ? <p className="inline-note">Leaderboard published.</p> : null}

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Event summary</p>
            <h3>Configuration review</h3>
          </div>
          <span className="badge">{event.status}</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr><td className="subtle-text">Name</td><td><strong>{event.name}</strong></td></tr>
              <tr><td className="subtle-text">Organization</td><td>{event.hostOrganization}</td></tr>
              <tr><td className="subtle-text">Format</td><td>{event.format}</td></tr>
              <tr><td className="subtle-text">Audience</td><td>{event.audience}</td></tr>
              <tr><td className="subtle-text">Dates</td><td>{event.startDate} — {event.endDate}</td></tr>
              <tr><td className="subtle-text">Location</td><td>{event.location}</td></tr>
              <tr><td className="subtle-text">Tracks</td><td>{event.tracks.join(", ")}</td></tr>
              <tr><td className="subtle-text">Judge target</td><td>{event.judgeCount}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-grid-two">
        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Live leaderboard</p>
              <h3>{liveLeaderboard.length} ranked projects</h3>
            </div>
            <form action={finalizeLeaderboardAction}>
              <input name="eventId" type="hidden" value={eventId} />
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
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {liveLeaderboard.map((entry) => (
                  <tr key={entry.projectId}>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                      {entry.rank}
                    </td>
                    <td>
                      <strong>{entry.projectName}</strong>
                      <div className="subtle-text">{entry.teamName}</div>
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
              <p className="eyebrow">Published snapshot</p>
              <h3>{publishedLeaderboard ? "Latest snapshot" : "No snapshot yet"}</h3>
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
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishedLeaderboard.entries.map((entry) => (
                      <tr key={`${publishedLeaderboard.id}-${entry.projectId}`}>
                        <td style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                          {entry.rank}
                        </td>
                        <td>
                          <strong>{entry.projectName}</strong>
                          <div className="subtle-text">{entry.teamName}</div>
                        </td>
                        <td style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                          {entry.finalScore.toFixed(2)}
                        </td>
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
      </div>
    </div>
  );
}
