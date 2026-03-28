import { saveAssignmentPolicyAction } from "@/app/admin/actions";
import { getEventJudges } from "@/lib/server/events";

export default async function JudgesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "assignments";
  const { judges, assignmentPolicy } = await getEventJudges(eventId);

  return (
    <div className="admin-dashboard">
      <div>
        <p className="eyebrow">Judges</p>
        <h2>Roster & assignments</h2>
      </div>

      {saved ? <p className="inline-note">Assignment plan persisted.</p> : null}

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Judge roster</p>
            <h3>{judges.length} judges</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Track</th>
                <th>Capacity</th>
                <th>Assigned</th>
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
                  <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>{judge.assignmentCapacity}</td>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>{judge.assignmentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Assignment policy</p>
            <h3>Configure judge routing</h3>
          </div>
        </div>
        <form action={saveAssignmentPolicyAction} className="stack-form">
          <input name="eventId" type="hidden" value={eventId} />
          <div className="inline-form-grid">
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
              <span>Minimum judges per project</span>
              <input defaultValue={assignmentPolicy.minimumJudges} min="1" name="minimumJudges" type="number" />
            </label>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <label className="checkbox-row">
              <input defaultChecked={assignmentPolicy.preferTrackJudges} name="preferTrackJudges" type="checkbox" />
              <span>Prefer track-matched judges</span>
            </label>
            <label className="checkbox-row">
              <input defaultChecked={assignmentPolicy.keepExistingAssignments} name="keepExistingAssignments" type="checkbox" />
              <span>Keep existing assignments</span>
            </label>
          </div>
          <button className="button button-primary" type="submit">
            Run assignment plan
          </button>
        </form>
      </div>
    </div>
  );
}
