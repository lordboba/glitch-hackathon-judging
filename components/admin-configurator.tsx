"use client";

import React, { useMemo, useState } from "react";

type HackathonType = "general" | "ai" | "design" | "climate" | "student" | "internal";
type HackathonMode = "in_person" | "hybrid" | "virtual";
type AudienceType = "open" | "invited" | "campus" | "enterprise";
type InviteRole = "judge" | "mentor" | "builder";
type InviteStatus = "pending" | "sent" | "accepted" | "revoked";

type HackathonConfig = {
  name: string;
  slug: string;
  type: HackathonType;
  mode: HackathonMode;
  audience: AudienceType;
  startDate: string;
  endDate: string;
  timezone: string;
  location: string;
  maxTeams: number;
  teamSizeMin: number;
  teamSizeMax: number;
  submissionWindowHours: number;
  allowWaitlist: boolean;
  allowLateEdits: boolean;
  requirePortfolio: boolean;
  requireKyc: boolean;
  judgingModel: "weighted" | "panel" | "community";
  judgeCount: number;
  mentorCount: number;
};

type InviteRecord = {
  id: string;
  name: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;
  track: string;
};

type LaunchReadinessItem = {
  label: string;
  detail: string;
  status: "ready" | "warning" | "pending";
};

type AdminConfiguratorProps = {
  initialConfig: HackathonConfig;
  initialInvites: InviteRecord[];
  organizerName: string;
};

const TYPE_OPTIONS: Array<{ value: HackathonType; label: string; description: string }> = [
  { value: "general", label: "General", description: "Balanced, open-ended event" },
  { value: "ai", label: "AI", description: "Model, agent, and tooling focused" },
  { value: "design", label: "Design", description: "Product, brand, and UX craft" },
  { value: "climate", label: "Climate", description: "Impact and sustainability projects" },
  { value: "student", label: "Student", description: "Campus or academic hackathon" },
  { value: "internal", label: "Internal", description: "Company or org innovation sprint" },
];

const MODE_OPTIONS: Array<{ value: HackathonMode; label: string }> = [
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "virtual", label: "Virtual" },
];

const AUDIENCE_OPTIONS: Array<{ value: AudienceType; label: string; description: string }> = [
  { value: "open", label: "Open", description: "Public registration with moderation" },
  { value: "invited", label: "Invited only", description: "Approval-based access for all participants" },
  { value: "campus", label: "Campus", description: "Student-driven event with school constraints" },
  { value: "enterprise", label: "Enterprise", description: "Private company-sponsored hackathon" },
];

const JUDGING_OPTIONS: Array<{ value: HackathonConfig["judgingModel"]; label: string; description: string }> = [
  { value: "weighted", label: "Weighted rubric", description: "Scores roll up from criteria and totals" },
  { value: "panel", label: "Panel review", description: "Shared decision making across judges" },
  { value: "community", label: "Community vote", description: "Audience participation with admin oversight" },
];

const ROLE_OPTIONS: Array<{ value: InviteRole; label: string; description: string }> = [
  { value: "judge", label: "Judge", description: "Scores submissions and submits notes" },
  { value: "mentor", label: "Mentor", description: "Can review, advise, and observe" },
  { value: "builder", label: "Builder", description: "Can submit projects and manage team access" },
];

const emptyInvite = {
  name: "",
  email: "",
  role: "judge" as InviteRole,
  track: "General",
};

function formatDate(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLaunchReadiness(config: HackathonConfig, invites: InviteRecord[]): LaunchReadinessItem[] {
  return [
    {
      label: "Access control",
      detail: config.audience === "invited" ? "Special authorization is required for admin and invitees." : "Public-facing registration is enabled with moderation.",
      status: config.audience === "invited" ? "ready" : "warning",
    },
    {
      label: "Judging coverage",
      detail: `${config.judgeCount} judges configured for ${config.judgingModel} scoring.`,
      status: config.judgeCount >= 3 ? "ready" : "warning",
    },
    {
      label: "Invite list",
      detail: `${invites.filter((invite) => invite.status !== "revoked").length} active invitations prepared.`,
      status: invites.length > 0 ? "ready" : "pending",
    },
    {
      label: "Event timing",
      detail: config.startDate && config.endDate ? `${formatDate(config.startDate)} to ${formatDate(config.endDate)}` : "Dates still need confirmation.",
      status: config.startDate && config.endDate ? "ready" : "pending",
    },
    {
      label: "Submission policy",
      detail: config.allowLateEdits ? "Late edits allowed with admin discretion." : "Submission lock is enforced after deadline.",
      status: config.allowLateEdits ? "warning" : "ready",
    },
  ];
}

export default function AdminConfigurator({
  initialConfig,
  initialInvites,
  organizerName,
}: AdminConfiguratorProps) {
  const [config, setConfig] = useState<HackathonConfig>(initialConfig);
  const [invites, setInvites] = useState<InviteRecord[]>(initialInvites);
  const [inviteForm, setInviteForm] = useState(emptyInvite);
  const [accessToken, setAccessToken] = useState("ORG-LOCKED");
  const [publishAcknowledged, setPublishAcknowledged] = useState(false);

  const launchReadiness = useMemo(() => getLaunchReadiness(config, invites), [config, invites]);

  const activeInvites = invites.filter((invite) => invite.status !== "revoked");
  const inviteRatio = Math.min(100, Math.round((activeInvites.length / Math.max(config.maxTeams, 1)) * 100));
  const readinessScore = useMemo(() => {
    const readyCount = launchReadiness.filter((item) => item.status === "ready").length;
    return Math.round((readyCount / launchReadiness.length) * 100);
  }, [launchReadiness]);

  const updateConfig = <K extends keyof HackathonConfig>(key: K, value: HackathonConfig[K]) => {
    setConfig((current) => {
      const next = { ...current, [key]: value };
      if (key === "name") next.slug = slugify(String(value)) || current.slug;
      return next;
    });
  };

  const addInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;

    const nextInvite: InviteRecord = {
      id: `invite-${Date.now()}`,
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: inviteForm.role,
      status: "pending",
      track: inviteForm.track.trim() || "General",
    };

    setInvites((current) => [nextInvite, ...current]);
    setInviteForm(emptyInvite);
  };

  const updateInviteStatus = (id: string, status: InviteStatus) => {
    setInvites((current) => current.map((invite) => (invite.id === id ? { ...invite, status } : invite)));
  };

  const removeInvite = (id: string) => {
    setInvites((current) => current.filter((invite) => invite.id !== id));
  };

  const rolesSummary = [
    { label: "Judges", value: config.judgeCount },
    { label: "Mentors", value: config.mentorCount },
    { label: "Invites active", value: activeInvites.length },
    { label: "Readiness", value: `${readinessScore}%` },
  ];

  return (
    <div className="admin-configurator">
      <div className="backdrop-grid" aria-hidden="true" />

      <section className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Protected organizer console</p>
            <h1>Hackathon configuration</h1>
            <p className="lede">
              Configure the event, define who can join, and prepare invites for judges, mentors,
              and builders.
            </p>
          </div>
          <div className="org-card">
            <span>Organizer</span>
            <strong>{organizerName}</strong>
            <small>Special authorization is required for admin access.</small>
          </div>
        </header>

        <div className="content-grid">
          <aside className="sidebar">
            <section className="lock-panel">
              <div className="lock-head">
                <div>
                  <p className="eyebrow">Authorization</p>
                  <h2>Admin access gate</h2>
                </div>
                <span className="status-pill">Restricted</span>
              </div>
              <p className="muted">
                This mockup assumes a special organizer authorization step before configuration can be edited.
              </p>
              <label className="field">
                <span>Authorization token</span>
                <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
              </label>
              <div className="token-row">
                <code>admin::{slugify(config.slug || config.name)}</code>
                <button type="button" className="secondary-button">
                  Verify access
                </button>
              </div>
            </section>

            <section className="summary-panel">
              <p className="eyebrow">Launch readiness</p>
              <h2>{readinessScore}% ready</h2>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${readinessScore}%` }} />
              </div>
              <div className="summary-grid">
                {rolesSummary.map((item) => (
                  <div className="summary-chip" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="launch-panel">
              <p className="eyebrow">Readiness checklist</p>
              <div className="checklist">
                {launchReadiness.map((item) => (
                  <article className={`check-item ${item.status}`} key={item.label}>
                    <div>
                      <h3>{item.label}</h3>
                      <p>{item.detail}</p>
                    </div>
                    <span>{item.status}</span>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <main className="main">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Hackathon basics</p>
                  <h2>What kind of event is this?</h2>
                </div>
                <span className="panel-badge">Vercel-ready mockup</span>
              </div>

              <div className="field-grid">
                <label className="field span-2">
                  <span>Hackathon name</span>
                  <input
                    value={config.name}
                    onChange={(event) => updateConfig("name", event.target.value)}
                    placeholder="Spring AI Builder Challenge"
                  />
                </label>
                <label className="field">
                  <span>Slug</span>
                  <input
                    value={config.slug}
                    onChange={(event) => updateConfig("slug", slugify(event.target.value))}
                    placeholder="spring-ai-builder-challenge"
                  />
                </label>
                <label className="field">
                  <span>Timezone</span>
                  <input
                    value={config.timezone}
                    onChange={(event) => updateConfig("timezone", event.target.value)}
                    placeholder="America/Los_Angeles"
                  />
                </label>
                <label className="field">
                  <span>Location</span>
                  <input
                    value={config.location}
                    onChange={(event) => updateConfig("location", event.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </label>
                <label className="field">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(event) => updateConfig("startDate", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>End date</span>
                  <input
                    type="date"
                    value={config.endDate}
                    onChange={(event) => updateConfig("endDate", event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Format and audience</p>
                  <h2>How this hackathon operates</h2>
                </div>
                <span className="panel-badge">Invitation controlled</span>
              </div>

              <div className="option-grid">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`option-card ${config.type === option.value ? "active" : ""}`}
                    onClick={() => updateConfig("type", option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>

              <div className="split-grid">
                <div>
                  <p className="section-label">Mode</p>
                  <div className="pill-row">
                    {MODE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`pill ${config.mode === option.value ? "active" : ""}`}
                        onClick={() => updateConfig("mode", option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="section-label">Audience</p>
                  <div className="option-list">
                    {AUDIENCE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`row-option ${config.audience === option.value ? "active" : ""}`}
                        onClick={() => updateConfig("audience", option.value)}
                      >
                        <div>
                          <strong>{option.label}</strong>
                          <span>{option.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Roles and judging</p>
                  <h2>Who can do what</h2>
                </div>
                <span className="panel-badge">Weighted scoring</span>
              </div>

              <div className="field-grid compact">
                <label className="field">
                  <span>Max teams</span>
                  <input
                    type="number"
                    min={1}
                    value={config.maxTeams}
                    onChange={(event) => updateConfig("maxTeams", Number(event.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Team size min</span>
                  <input
                    type="number"
                    min={1}
                    value={config.teamSizeMin}
                    onChange={(event) => updateConfig("teamSizeMin", Number(event.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Team size max</span>
                  <input
                    type="number"
                    min={1}
                    value={config.teamSizeMax}
                    onChange={(event) => updateConfig("teamSizeMax", Number(event.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Submission window (hours)</span>
                  <input
                    type="number"
                    min={1}
                    value={config.submissionWindowHours}
                    onChange={(event) =>
                      updateConfig("submissionWindowHours", Number(event.target.value))
                    }
                  />
                </label>
                <label className="field">
                  <span>Judges</span>
                  <input
                    type="number"
                    min={1}
                    value={config.judgeCount}
                    onChange={(event) => updateConfig("judgeCount", Number(event.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Mentors</span>
                  <input
                    type="number"
                    min={0}
                    value={config.mentorCount}
                    onChange={(event) => updateConfig("mentorCount", Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="option-grid dense">
                {JUDGING_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`option-card narrow ${config.judgingModel === option.value ? "active" : ""}`}
                    onClick={() => updateConfig("judgingModel", option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>

              <div className="toggle-grid">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config.allowWaitlist}
                    onChange={(event) => updateConfig("allowWaitlist", event.target.checked)}
                  />
                  <span>
                    <strong>Allow waitlist</strong>
                    <small>Open overflow registrations when capacity is reached.</small>
                  </span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config.allowLateEdits}
                    onChange={(event) => updateConfig("allowLateEdits", event.target.checked)}
                  />
                  <span>
                    <strong>Allow late edits</strong>
                    <small>Keep submissions editable after the original deadline.</small>
                  </span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config.requirePortfolio}
                    onChange={(event) => updateConfig("requirePortfolio", event.target.checked)}
                  />
                  <span>
                    <strong>Require portfolio</strong>
                    <small>Ask builders to include a portfolio or project history.</small>
                  </span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config.requireKyc}
                    onChange={(event) => updateConfig("requireKyc", event.target.checked)}
                  />
                  <span>
                    <strong>Require extra verification</strong>
                    <small>Gate access with stronger organizer approval.</small>
                  </span>
                </label>
              </div>
            </section>
          </main>
        </div>

        <section className="bottom-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Invite management</p>
                <h2>Invite judges, mentors, and builders</h2>
              </div>
              <span className="panel-badge">Local state only</span>
            </div>

            <div className="invite-form">
              <label className="field">
                <span>Name</span>
                <input
                  value={inviteForm.name}
                  onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Alex Chen"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="alex@example.com"
                />
              </label>
              <label className="field">
                <span>Track</span>
                <input
                  value={inviteForm.track}
                  onChange={(event) =>
                    setInviteForm((current) => ({ ...current, track: event.target.value }))
                  }
                  placeholder="General"
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((current) => ({ ...current, role: event.target.value as InviteRole }))
                  }
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="primary-button" onClick={addInvite}>
                Add invite
              </button>
            </div>

            <div className="invite-meta">
              <div className="meta-stat">
                <span>Active invites</span>
                <strong>{activeInvites.length}</strong>
              </div>
              <div className="meta-stat">
                <span>Capacity</span>
                <strong>{inviteRatio}%</strong>
              </div>
              <div className="meta-stat">
                <span>Policy</span>
                <strong>{config.audience === "invited" ? "Approval required" : "Open registration"}</strong>
              </div>
            </div>

            <div className="invite-list">
              {invites.map((invite) => (
                <article className="invite-row" key={invite.id}>
                  <div className="invite-main">
                    <strong>{invite.name}</strong>
                    <span>{invite.email}</span>
                    <code>{invite.track}</code>
                  </div>
                  <div className="invite-controls">
                    <span className={`status-dot ${invite.status}`}>{invite.status}</span>
                    <div className="mini-actions">
                      <button type="button" onClick={() => updateInviteStatus(invite.id, "sent")}>
                        Send
                      </button>
                      <button type="button" onClick={() => updateInviteStatus(invite.id, "accepted")}>
                        Accept
                      </button>
                      <button type="button" onClick={() => updateInviteStatus(invite.id, "revoked")}>
                        Revoke
                      </button>
                      <button type="button" className="ghost-danger" onClick={() => removeInvite(invite.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Publish state</p>
                <h2>Configuration summary</h2>
              </div>
              <span className={`panel-badge ${publishAcknowledged ? "ready" : "pending"}`}>
                {publishAcknowledged ? "Ready to publish" : "Review pending"}
              </span>
            </div>

            <div className="config-summary">
              <div className="summary-row">
                <span>Event</span>
                <strong>{config.name}</strong>
              </div>
              <div className="summary-row">
                <span>Type</span>
                <strong>{config.type}</strong>
              </div>
              <div className="summary-row">
                <span>Audience</span>
                <strong>{config.audience}</strong>
              </div>
              <div className="summary-row">
                <span>Mode</span>
                <strong>{config.mode}</strong>
              </div>
              <div className="summary-row">
                <span>Dates</span>
                <strong>
                  {formatDate(config.startDate)} to {formatDate(config.endDate)}
                </strong>
              </div>
              <div className="summary-row">
                <span>Invite policy</span>
                <strong>{config.requireKyc ? "Special authorization required" : "Standard organizer approval"}</strong>
              </div>
            </div>

            <label className="publish-toggle">
              <input
                type="checkbox"
                checked={publishAcknowledged}
                onChange={(event) => setPublishAcknowledged(event.target.checked)}
              />
              <span>
                <strong>Confirm this configuration is ready</strong>
                <small>Publish only after the organizer review is complete.</small>
              </span>
            </label>

            <div className="publish-actions">
              <button type="button" className="secondary-button">
                Save draft
              </button>
              <button type="button" className="primary-button">
                Publish hackathon
              </button>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .admin-configurator {
          --bg: #f7f7f4;
          --surface: #ffffff;
          --surface-alt: #eef1f4;
          --text: #111827;
          --muted: #5b6472;
          --primary: #1f4ed8;
          --primary-deep: #173db0;
          --teal: #0f766e;
          --border: #d7dee7;
          --shadow: 0 14px 40px rgba(17, 24, 39, 0.08);
          --radius: 20px;
          position: relative;
          min-height: 100vh;
          padding: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(247, 247, 244, 0.94)),
            var(--bg);
          color: var(--text);
          font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
        }

        .backdrop-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image:
            linear-gradient(to right, rgba(215, 222, 231, 0.55) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(215, 222, 231, 0.45) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(180deg, transparent, black 12%, black 88%, transparent);
        }

        .shell {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
        }

        .topbar,
        .content-grid,
        .bottom-grid {
          display: grid;
          gap: 24px;
        }

        .topbar {
          grid-template-columns: 1.5fr 0.9fr;
          align-items: end;
          margin-bottom: 24px;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1,
        h2 {
          font-family: "Instrument Serif", Georgia, serif;
          letter-spacing: -0.03em;
          line-height: 0.95;
        }

        h1 {
          font-size: clamp(2.7rem, 6vw, 4.4rem);
          margin-top: 8px;
        }

        h2 {
          font-size: clamp(1.4rem, 3vw, 2.15rem);
        }

        .eyebrow,
        .section-label {
          display: block;
          margin-bottom: 10px;
          color: var(--muted);
          font-size: 0.74rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .lede,
        .muted,
        .field span,
        .option-card span,
        .row-option span,
        .summary-row span,
        .toggle small,
        .publish-toggle small,
        .check-item p,
        .org-card small {
          color: var(--muted);
          line-height: 1.5;
        }

        .org-card,
        .lock-panel,
        .summary-panel,
        .launch-panel,
        .panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .org-card {
          padding: 20px;
          display: grid;
          gap: 6px;
        }

        .org-card span,
        .org-card strong {
          display: block;
        }

        .org-card strong {
          font-size: 1.05rem;
        }

        .content-grid {
          grid-template-columns: 340px minmax(0, 1fr);
          align-items: start;
        }

        .sidebar {
          display: grid;
          gap: 16px;
        }

        .lock-panel,
        .summary-panel,
        .launch-panel,
        .panel,
        .bottom-grid .panel {
          padding: 24px;
        }

        .lock-head,
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 16px;
          margin-bottom: 18px;
        }

        .status-pill,
        .panel-badge,
        .summary-chip,
        .status-dot {
          display: inline-flex;
          align-items: center;
          padding: 8px 11px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          background: var(--surface-alt);
          color: var(--text);
        }

        .panel-badge.ready {
          background: rgba(15, 118, 110, 0.12);
          color: var(--teal);
        }

        .panel-badge.pending {
          background: rgba(31, 78, 216, 0.1);
          color: var(--primary);
        }

        .field,
        .toggle,
        .publish-toggle {
          display: grid;
          gap: 8px;
        }

        .field input,
        .field select {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 14px;
          font: inherit;
          background: #fff;
          color: var(--text);
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }

        .field input:focus,
        .field select:focus {
          border-color: rgba(31, 78, 216, 0.45);
          box-shadow: 0 0 0 4px rgba(31, 78, 216, 0.1);
        }

        .token-row,
        .publish-actions,
        .mini-actions,
        .summary-grid,
        .invite-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        code {
          padding: 10px 12px;
          border-radius: 12px;
          background: #f3f6fb;
          color: #1b2a4a;
          font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, monospace;
          font-size: 0.82rem;
        }

        .secondary-button,
        .primary-button,
        .mini-actions button {
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 11px 16px;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
        }

        .secondary-button,
        .mini-actions button {
          background: #fff;
          color: var(--text);
        }

        .primary-button {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        .secondary-button:hover,
        .primary-button:hover,
        .mini-actions button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(17, 24, 39, 0.08);
        }

        .progress-track {
          height: 10px;
          border-radius: 999px;
          background: #edf2f7;
          overflow: hidden;
          margin: 14px 0 18px;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--primary), var(--teal));
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .summary-chip {
          display: grid;
          gap: 4px;
          align-content: start;
          min-height: 84px;
          padding: 14px;
          border: 1px solid var(--border);
          background: #fff;
        }

        .summary-chip strong {
          font-size: 1rem;
        }

        .checklist {
          display: grid;
          gap: 12px;
        }

        .check-item {
          padding: 14px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: #fafbfd;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .check-item.ready {
          border-color: rgba(15, 118, 110, 0.22);
          background: rgba(15, 118, 110, 0.06);
        }

        .check-item.warning {
          border-color: rgba(180, 83, 9, 0.2);
          background: rgba(180, 83, 9, 0.05);
        }

        .check-item.pending {
          border-color: rgba(31, 78, 216, 0.18);
          background: rgba(31, 78, 216, 0.05);
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .field-grid.compact {
          margin-bottom: 18px;
        }

        .span-2 {
          grid-column: span 2;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .option-grid.dense {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 14px;
        }

        .option-card,
        .row-option {
          text-align: left;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          cursor: pointer;
          transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
        }

        .option-card strong,
        .row-option strong {
          display: block;
          margin-bottom: 6px;
        }

        .option-card.active,
        .row-option.active,
        .pill.active {
          border-color: rgba(31, 78, 216, 0.38);
          box-shadow: 0 12px 24px rgba(31, 78, 216, 0.08);
        }

        .option-card.narrow {
          min-height: 104px;
        }

        .split-grid {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 16px;
        }

        .pill-row,
        .option-list {
          display: grid;
          gap: 10px;
        }

        .pill {
          width: fit-content;
          border: 1px solid var(--border);
          background: #fff;
          padding: 10px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 600;
        }

        .row-option {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        .toggle-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .toggle,
        .publish-toggle {
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: #fff;
          grid-template-columns: auto 1fr;
          align-items: start;
        }

        .toggle input,
        .publish-toggle input {
          margin-top: 4px;
        }

        .toggle strong,
        .publish-toggle strong {
          display: block;
          margin-bottom: 4px;
        }

        .bottom-grid {
          grid-template-columns: 1.1fr 0.9fr;
          align-items: start;
          margin-top: 24px;
        }

        .invite-form {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .invite-form .primary-button {
          align-self: end;
          height: 46px;
        }

        .invite-meta {
          margin-bottom: 16px;
        }

        .meta-stat {
          flex: 1;
          min-width: 120px;
          padding: 14px;
          border-radius: 16px;
          background: #fafbfd;
          border: 1px solid var(--border);
        }

        .meta-stat span {
          display: block;
          color: var(--muted);
          font-size: 0.8rem;
          margin-bottom: 6px;
        }

        .meta-stat strong {
          font-size: 1rem;
        }

        .invite-list {
          display: grid;
          gap: 10px;
        }

        .invite-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: #fff;
        }

        .invite-main {
          display: grid;
          gap: 4px;
        }

        .invite-main code {
          width: fit-content;
        }

        .invite-controls {
          display: grid;
          justify-items: end;
          gap: 10px;
        }

        .status-dot.pending {
          background: rgba(31, 78, 216, 0.08);
          color: var(--primary);
        }

        .status-dot.sent {
          background: rgba(15, 118, 110, 0.12);
          color: var(--teal);
        }

        .status-dot.accepted {
          background: rgba(21, 128, 61, 0.12);
          color: #15803d;
        }

        .status-dot.revoked {
          background: rgba(180, 35, 24, 0.12);
          color: #b42318;
        }

        .ghost-danger {
          color: #b42318 !important;
          border-color: rgba(180, 35, 24, 0.16) !important;
        }

        .config-summary {
          display: grid;
          gap: 10px;
          margin-bottom: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .summary-row:last-child {
          border-bottom: 0;
        }

        .summary-row strong {
          text-align: right;
        }

        .publish-actions {
          margin-top: 16px;
        }

        @media (max-width: 1080px) {
          .topbar,
          .content-grid,
          .bottom-grid,
          .split-grid,
          .invite-form {
            grid-template-columns: 1fr;
          }

          .option-grid,
          .toggle-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .span-2 {
            grid-column: auto;
          }
        }

        @media (max-width: 720px) {
          .admin-configurator {
            padding: 16px;
          }

          .field-grid,
          .option-grid,
          .toggle-grid,
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .invite-row,
          .check-item {
            grid-template-columns: 1fr;
          }

          .invite-controls {
            justify-items: start;
          }
        }
      `}</style>
    </div>
  );
}
