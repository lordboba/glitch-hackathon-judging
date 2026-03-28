import Link from "next/link";

import { getSession } from "@/lib/auth";
import {
  defaultHackathonConfig,
  participantInviteDirectory,
  scoringRubric,
} from "@/lib/mock-data";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="marketing-shell">
      <div className="contour contour-left" />
      <div className="contour contour-right" />

      <section className="hero-panel">
        <div className="top-utility">
          <div>
            <p className="eyebrow">Hackathon platform mock</p>
            <h1>Signal Jury</h1>
          </div>
          <div className="utility-cluster">
            <span className="utility-pill">{defaultHackathonConfig.format} format</span>
            <span className="utility-pill">{defaultHackathonConfig.scoringMode} scoring</span>
            {session ? (
              <span className="utility-pill utility-pill-strong">
                Signed in as {session.name} · {session.role}
              </span>
            ) : null}
          </div>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Cleaner operations layer</p>
            <h2>Configure the hackathon once, then invite judges and builders into the right workspace.</h2>
            <p className="lede">
              This Next.js prototype replaces the noisy single-screen mock with a calmer product flow:
              organizer authorization, general event configuration, invite-based access, and role-specific workspaces.
            </p>
            <div className="cta-row">
              <Link className="button button-primary" href="/admin/access">
                Organizer access
              </Link>
              <Link className="button button-secondary" href="/join">
                Join by invite
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
              <p className="eyebrow">What changed</p>
              <h3>Organizer access now requires a separate authorization code.</h3>
              <p>
                The admin route is no longer just another tab. Organizers must pass a dedicated gate
                before configuring the event or managing invites.
              </p>
            </article>
            <article className="feature-card">
              <p className="eyebrow">Invite directory</p>
              <div className="token-list">
                {participantInviteDirectory.map((invite) => (
                  <div className="token-row" key={invite.code}>
                    <div>
                      <strong>{invite.role}</strong>
                      <span>{invite.email}</span>
                    </div>
                    <code>{invite.code}</code>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="overview-grid">
        <article className="card">
          <p className="eyebrow">General configuration</p>
          <h3>One configuration page for format, roles, scoring, and access.</h3>
          <div className="detail-list">
            <div>
              <span>Audience</span>
              <strong>{defaultHackathonConfig.audience}</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>{defaultHackathonConfig.visibility}</strong>
            </div>
            <div>
              <span>Assignment model</span>
              <strong>{defaultHackathonConfig.judgeAssignmentMode}</strong>
            </div>
            <div>
              <span>Timezone</span>
              <strong>{defaultHackathonConfig.timezone}</strong>
            </div>
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Scoring shell</p>
          <h3>Weighted rubric stays configurable but readable.</h3>
          <div className="rubric-preview-list">
            {scoringRubric.map((criterion) => (
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
          <p className="eyebrow">Deployment target</p>
          <h3>App Router structure ready for Vercel.</h3>
          <ul className="bullet-list">
            <li>Server-side organizer and invite access gates via cookies and Next actions.</li>
            <li>Clean route split for landing, organizer access, join flow, admin workspace, and participant workspace.</li>
            <li>Dependency footprint stays small: Next.js, React, and TypeScript only.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
