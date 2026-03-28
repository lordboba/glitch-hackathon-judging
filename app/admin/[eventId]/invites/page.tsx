import { createInviteAction, revokeInviteAction } from "@/app/admin/actions";
import { getEventInvites } from "@/lib/server/events";

export default async function InvitesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const inviteCode = typeof sp.inviteCode === "string" ? sp.inviteCode : undefined;
  const saved = sp.saved === "invite";
  const invites = await getEventInvites(eventId);

  return (
    <div className="admin-dashboard">
      <div>
        <p className="eyebrow">Invites</p>
        <h2>Judge access codes</h2>
      </div>

      {inviteCode ? (
        <p className="inline-note">
          New invite code: <code>{inviteCode}</code>
        </p>
      ) : null}
      {saved ? <p className="inline-note">Invite updated.</p> : null}

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Create invite</p>
            <h3>Generate a judge access code</h3>
          </div>
        </div>
        <form action={createInviteAction} className="stack-form">
          <input name="eventId" type="hidden" value={eventId} />
          <div className="admin-grid-two">
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
              <span>Custom code (optional)</span>
              <input name="code" placeholder="JUDGE-CUSTOM-01" type="text" />
            </label>
          </div>
          <button className="button button-primary" type="submit">
            Create invite
          </button>
        </form>
      </div>

      <div className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Invite roster</p>
            <h3>{invites.length} invites</h3>
          </div>
        </div>
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
                  <td>
                    <span className="badge">{invite.status}</span>
                  </td>
                  <td>
                    {invite.status === "SENT" ? (
                      <form action={revokeInviteAction}>
                        <input name="eventId" type="hidden" value={eventId} />
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
    </div>
  );
}
