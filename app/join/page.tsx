import Link from "next/link";

import { joinWithInvite } from "@/app/actions";
import { listOpenJudgeInvites } from "@/lib/server/events";

export const dynamic = "force-dynamic";

function getMessage(error?: string) {
  if (error === "invalid_invite") {
    return "That invite code was invalid, already redeemed, or revoked.";
  }

  return null;
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, invites] = await Promise.all([searchParams, listOpenJudgeInvites()]);
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = getMessage(error);

  return (
    <main className="access-shell">
      <section className="access-card access-card-emphasis">
        <p className="eyebrow">Judge invite access</p>
        <h1>Judges enter with single-use invite codes.</h1>
        <p className="lede">
          Invite redemption creates a database-backed judge session and binds the judge to the
          correct event roster.
        </p>
        <div className="token-list">
          {invites.map((invite) => (
            <div className="token-row" key={invite.id}>
              <div>
                <strong>{invite.label}</strong>
                <span>{invite.email}</span>
              </div>
              <code>{invite.demoCode}</code>
            </div>
          ))}
        </div>
        <Link className="text-link" href="/">
          &larr; Back to overview
        </Link>
      </section>

      <section className="access-card">
        <p className="eyebrow">Join event</p>
        <h2>Enter your judge invite code.</h2>
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
