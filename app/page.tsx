import Link from "next/link";

import { getSession } from "@/lib/auth";
import { getHomepageData } from "@/lib/server/events";
import { RUBRIC } from "@/lib/server/rubric";

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
                  : "Run migrations and seed to load the first event."}
              </p>
            </article>
            <article className="feature-card">
              <p className="eyebrow">Demo judge invites</p>
              <div className="token-list">
                {data.openInvites.map((invite) => (
                  <div className="token-row" key={invite.id}>
                    <div>
                      <strong>{invite.label}</strong>
                      <span>{invite.email}</span>
                    </div>
                    <code>{invite.demoCode}</code>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="overview-grid">
        <article className="card">
          <p className="eyebrow">Stack</p>
          <h3>Single deployable stack on one VM</h3>
          <ul className="bullet-list">
            <li>Next.js App Router application with server actions and route handlers.</li>
            <li>Shared PostgreSQL persistence through Prisma.</li>
            <li>Docker Compose runtime for app plus database on Hetzner.</li>
          </ul>
        </article>

        <article className="card">
          <p className="eyebrow">Rubric</p>
          <h3>Weighted scorecards stored server-side</h3>
          <div className="rubric-preview-list">
            {RUBRIC.map((criterion) => (
              <div className="rubric-preview-row" key={criterion.key}>
                <div>
                  <strong>{criterion.label}</strong>
                  <span>{criterion.description}</span>
                </div>
                <span className="badge">{Math.round(criterion.weight * 100)}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Flow</p>
          <h3>Admin and judge areas share the same data model</h3>
          <ul className="bullet-list">
            <li>Admins create events, import projects, generate assignments, and publish leaderboards.</li>
            <li>Judges redeem invite codes, score assigned projects, and submit locked scorecards.</li>
            <li>Leaderboards update live from submitted scorecards and can be snapshotted explicitly.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
