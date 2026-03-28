import Link from "next/link";

import { getSession } from "@/lib/auth";
import { getHomepageData } from "@/lib/server/events";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, data] = await Promise.all([getSession(), getHomepageData()]);

  return (
    <main className="marketing-shell">
      <section className="hero-panel">
        <div className="top-utility">
          <div>
            <p className="eyebrow">Hackathon judging backend</p>
            <h1>glitch<span style={{ color: "var(--accent)" }}>_</span>graders</h1>
          </div>
          <div className="utility-cluster">
            {data.event ? <span className="utility-pill">{data.event.format}</span> : null}
            <span className="utility-pill">postgres</span>
            <span className="utility-pill">docker compose</span>
            {session ? (
              <span className="utility-pill utility-pill-strong">
                {session.name} · {session.role}
              </span>
            ) : null}
          </div>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <h2>One app, one database, one judging workflow.</h2>
            <p className="lede">
              The mockup has been replaced with a DB-backed backend for events, judge invites,
              imports, assignments, scorecards, and leaderboard publication.
            </p>
            <div className="cta-row">
              <Link className="button button-primary" href="/admin/access">
                Admin access
              </Link>
              <Link className="button button-secondary" href="/join">
                Judge invite access
              </Link>
              {session ? (
                <Link
                  className="button button-ghost"
                  href={session.role === "admin" ? "/admin" : "/workspace"}
                >
                  Continue session
                </Link>
              ) : null}
            </div>
          </div>

          <div className="hero-side-stack">
            <article className="feature-card feature-card-dark">
              <p className="eyebrow">Active event</p>
              <h3>{data.event?.name ?? "No event loaded"}</h3>
              <p>
                {data.event
                  ? `${data.event.startDate} to ${data.event.endDate} · ${data.event.location}`
                  : "Create your first event from the organizer workspace."}
              </p>
            </article>
            <article className="feature-card">
              <p className="eyebrow">Invite-based access</p>
              {data.openInvites.length > 0 ? (
                <div className="token-list">
                  {data.openInvites.map((invite) => (
                    <div className="token-row" key={invite.id}>
                      <div>
                        <strong>{invite.label}</strong>
                        <span>{invite.eventName}</span>
                      </div>
                      <span>{invite.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="lede">
                  Judge access is invite-only. Invite codes are generated and distributed privately by
                  admins.
                </p>
              )}
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
