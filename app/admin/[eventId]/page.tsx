import Link from "next/link";

import { getEventSummary } from "@/lib/server/events";
import { computeLiveLeaderboard } from "@/lib/server/leaderboard";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [event, leaderboard] = await Promise.all([
    getEventSummary(eventId),
    computeLiveLeaderboard(eventId),
  ]);

  if (!event) return null;

  const topEntries = leaderboard.slice(0, 3);

  return (
    <div className="admin-dashboard">
      <div>
        <p className="eyebrow">Event overview</p>
        <h2>{event.name}</h2>
        <p className="subtle-text" style={{ marginTop: 4 }}>
          {event.startDate} — {event.endDate} · {event.location}
        </p>
      </div>

      <div className="admin-grid-two" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <div className="list-panel">
          <span className="eyebrow">Projects</span>
          <div style={{ fontSize: 28, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: "#0f172a" }}>
            {event.projectCount}
          </div>
        </div>
        <div className="list-panel">
          <span className="eyebrow">Judges</span>
          <div style={{ fontSize: 28, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: "#0f172a" }}>
            {event.judgeCount}
          </div>
        </div>
        <div className="list-panel">
          <span className="eyebrow">Invites</span>
          <div style={{ fontSize: 28, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: "#0f172a" }}>
            {event.inviteCount}
          </div>
        </div>
        <div className="list-panel">
          <span className="eyebrow">Scorecards</span>
          <div style={{ fontSize: 28, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: "#0f172a" }}>
            {event.submittedScorecards}
          </div>
        </div>
      </div>

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Quick navigation</p>
            <h3>Manage this event</h3>
          </div>
        </div>
        <div className="utility-cluster">
          <Link className="button button-secondary" href={`/admin/${eventId}/config`}>
            Configuration
          </Link>
          <Link className="button button-secondary" href={`/admin/${eventId}/invites`}>
            Invites
          </Link>
          <Link className="button button-secondary" href={`/admin/${eventId}/judges`}>
            Judges & Assignments
          </Link>
          <Link className="button button-secondary" href={`/admin/${eventId}/rankings`}>
            Rankings
          </Link>
          <Link className="button button-secondary" href={`/admin/${eventId}/publish`}>
            Publish
          </Link>
        </div>
      </div>

      {topEntries.length > 0 ? (
        <div className="card admin-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Top projects</p>
              <h3>Leaderboard preview</h3>
            </div>
            <Link className="button button-ghost" href={`/admin/${eventId}/rankings`}>
              Full rankings &rarr;
            </Link>
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
                {topEntries.map((entry) => (
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
      ) : null}
    </div>
  );
}
