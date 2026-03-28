import Link from "next/link";

import { joinWithInvite } from "@/app/actions";
import { participantInviteDirectory } from "@/lib/mock-data";

function getMessage(error?: string) {
  if (error === "invalid_invite") {
    return "That invite code does not match the current event roster.";
  }

  return null;
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = getMessage(error);

  return (
    <main className="access-shell">
      <section className="access-card access-card-emphasis">
        <p className="eyebrow">Invite access</p>
        <h1>Judges and builders enter through invite codes, not the admin route.</h1>
        <p className="lede">
          The organizer configures the event first, then sends role-specific invites. This keeps the
          product closer to how a real hosted hackathon should be operated.
        </p>
        <div className="token-list">
          {participantInviteDirectory.map((invite) => (
            <div className="token-row" key={invite.code}>
              <div>
                <strong>{invite.role}</strong>
                <span>{invite.label}</span>
              </div>
              <code>{invite.code}</code>
            </div>
          ))}
        </div>
        <Link className="text-link" href="/">
          Back to overview
        </Link>
      </section>

      <section className="access-card">
        <p className="eyebrow">Join this event</p>
        <h2>Enter the invite code you received.</h2>
        {message ? <p className="inline-error">{message}</p> : null}
        <form action={joinWithInvite} className="stack-form">
          <label>
            <span>Invite code</span>
            <input name="inviteCode" placeholder="JUDGE-ORBIT-27" required type="text" />
          </label>
          <button className="button button-primary button-full" type="submit">
            Continue to workspace
          </button>
        </form>
      </section>
    </main>
  );
}
