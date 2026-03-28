"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type Role = "judge" | "builder";

type Session = {
  role: Role;
  userName: string;
  orgName?: string;
  hackathonName?: string;
  teamName?: string;
  inviteStatus?: "invited" | "pending" | "verified" | "approval-required";
  accessLabel?: string;
};

type Assignment = {
  id: string;
  title: string;
  teamName: string;
  summary: string;
  description?: string;
  track?: string;
  stage?: string;
  repoUrl?: string;
  demoUrl?: string;
  invitationCode?: string;
  inviteStatus?: "sent" | "accepted" | "pending" | "revoked";
  readiness?: "ready" | "needs-review" | "blocked";
  scores?: Partial<Record<CriterionKey, number>>;
  comments?: Partial<Record<CriterionKey, string>>;
  overallComment?: string;
};

type BuilderChecklistItem = {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
};

type Props = {
  session: Session;
  assignments: Assignment[];
  builderChecklist: BuilderChecklistItem[];
};

type CriterionKey = "innovation" | "execution" | "impact" | "design" | "demo";

const CRITERIA: Array<{
  key: CriterionKey;
  label: string;
  weight: number;
  helper: string;
}> = [
  {
    key: "innovation",
    label: "Innovation",
    weight: 0.3,
    helper: "Freshness of the idea and how clearly it pushes the category forward.",
  },
  {
    key: "execution",
    label: "Execution",
    weight: 0.3,
    helper: "Stability, completeness, and whether the product feels real.",
  },
  {
    key: "impact",
    label: "Impact",
    weight: 0.2,
    helper: "Practical usefulness and the size of the problem being solved.",
  },
  {
    key: "design",
    label: "Design",
    weight: 0.1,
    helper: "Clarity, visual refinement, and information hierarchy.",
  },
  {
    key: "demo",
    label: "Demo",
    weight: 0.1,
    helper: "Storytelling, flow, and whether the pitch lands cleanly.",
  },
];

const SCORE_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Exceptional",
};

function clampScore(value: number) {
  return Math.min(5, Math.max(1, value));
}

function getInitialSelectedAssignment(assignments: Assignment[]) {
  return assignments[0]?.id ?? "";
}

function getDefaultScores(assignment?: Assignment) {
  const source = assignment?.scores ?? {};

  return CRITERIA.reduce<Record<CriterionKey, number>>((acc, criterion) => {
    acc[criterion.key] = clampScore(source[criterion.key] ?? 3);
    return acc;
  }, {} as Record<CriterionKey, number>);
}

function weightedTotal(scores: Record<CriterionKey, number>) {
  return CRITERIA.reduce((sum, criterion) => sum + scores[criterion.key] * criterion.weight, 0);
}

function readinessLabel(value?: Assignment["readiness"]) {
  switch (value) {
    case "ready":
      return "Ready to submit";
    case "needs-review":
      return "Needs review";
    case "blocked":
      return "Blocked";
    default:
      return "Not set";
  }
}

function inviteLabel(value?: Assignment["inviteStatus"]) {
  switch (value) {
    case "accepted":
      return "Accepted";
    case "sent":
      return "Sent";
    case "revoked":
      return "Revoked";
    case "pending":
    default:
      return "Pending";
  }
}

export default function ParticipantWorkspace({
  session,
  assignments,
  builderChecklist,
}: Props) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(
    getInitialSelectedAssignment(assignments),
  );
  const [judgeScores, setJudgeScores] = useState<Record<string, Record<CriterionKey, number>>>(() => {
    const initial = assignments[0];
    return initial ? { [initial.id]: getDefaultScores(initial) } : {};
  });
  const [judgeComments, setJudgeComments] = useState<Record<string, string>>(() => {
    const initial = assignments[0];
    return initial ? { [initial.id]: initial.overallComment ?? "" } : {};
  });
  const [criterionComments, setCriterionComments] = useState<
    Record<string, Partial<Record<CriterionKey, string>>>
  >(() => {
    const initial = assignments[0];
    return initial ? { [initial.id]: initial.comments ?? {} } : {};
  });
  const [builderItems, setBuilderItems] = useState(builderChecklist);
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("builder");
  const [inviteStatus, setInviteStatus] = useState<Assignment["inviteStatus"]>("pending");
  const [launchNote, setLaunchNote] = useState("Config saved locally. Ready for organizer review.");

  useEffect(() => {
    setSelectedAssignmentId(getInitialSelectedAssignment(assignments));
    if (assignments[0]) {
      setJudgeScores((current) => ({
        ...current,
        [assignments[0].id]: current[assignments[0].id] ?? getDefaultScores(assignments[0]),
      }));
      setJudgeComments((current) => ({
        ...current,
        [assignments[0].id]: current[assignments[0].id] ?? assignments[0].overallComment ?? "",
      }));
      setCriterionComments((current) => ({
        ...current,
        [assignments[0].id]: current[assignments[0].id] ?? assignments[0].comments ?? {},
      }));
    }
  }, [assignments]);

  useEffect(() => {
    setBuilderItems(builderChecklist);
  }, [builderChecklist]);

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAssignmentId) ?? assignments[0],
    [assignments, selectedAssignmentId],
  );

  const currentScores = useMemo(() => {
    if (!selectedAssignment) {
      return CRITERIA.reduce<Record<CriterionKey, number>>((acc, criterion) => {
        acc[criterion.key] = 3;
        return acc;
      }, {} as Record<CriterionKey, number>);
    }

    return judgeScores[selectedAssignment.id] ?? getDefaultScores(selectedAssignment);
  }, [judgeScores, selectedAssignment]);

  const total = weightedTotal(currentScores);

  const updateScore = (key: CriterionKey, value: number) => {
    if (!selectedAssignment) {
      return;
    }

    setJudgeScores((current) => ({
      ...current,
      [selectedAssignment.id]: {
        ...(current[selectedAssignment.id] ?? getDefaultScores(selectedAssignment)),
        [key]: clampScore(value),
      },
    }));
  };

  const updateComment = (value: string) => {
    if (!selectedAssignment) {
      return;
    }

    setJudgeComments((current) => ({
      ...current,
      [selectedAssignment.id]: value,
      }));
  };

  const updateCriterionComment = (key: CriterionKey, value: string) => {
    if (!selectedAssignment) {
      return;
    }

    setCriterionComments((current) => ({
      ...current,
      [selectedAssignment.id]: {
        ...(current[selectedAssignment.id] ?? selectedAssignment.comments ?? {}),
        [key]: value,
      },
    }));
  };

  const toggleChecklistItem = (itemId: string) => {
    setBuilderItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
    );
  };

  const completedChecklist = builderItems.filter((item) => item.done).length;
  const readinessPercent = builderItems.length === 0 ? 0 : Math.round((completedChecklist / builderItems.length) * 100);

  return (
    <div className="workspace">
      <div className="shell">
        <aside className="rail">
          <div className="brand-block">
            <p className="eyebrow">{session.hackathonName ?? "Hackathon Control"}</p>
            <h1>{session.role === "judge" ? "Judge Workspace" : "Builder Workspace"}</h1>
            <p className="subtle">
              {session.orgName ? `${session.orgName} · ` : ""}
              {session.userName}
            </p>
          </div>

          <div className="panel">
            <span className="label">Session</span>
            <strong>{session.accessLabel ?? session.inviteStatus ?? "signed in"}</strong>
            <p className="subtle">
              {session.role === "judge"
                ? "Invite-based judge access with scoring permissions only."
                : "Builder access is linked to a verified team invite and submission status."}
            </p>
          </div>

          <div className="panel">
            <span className="label">Participation</span>
            <strong>{inviteLabel(session.inviteStatus as Assignment["inviteStatus"])}</strong>
            <p className="subtle">
              {session.role === "judge"
                ? "Judges can review assigned projects and submit final score sheets."
                : "Builders can monitor checklist completion and invite progress before launch."}
            </p>
          </div>
        </aside>

        <main className="content">
          {session.role === "judge" ? (
            <section className="judge-layout">
              <div className="project-list">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Assigned projects</p>
                    <h2>Review queue</h2>
                  </div>
                  <span className="badge">{assignments.length} assigned</span>
                </div>

                <div className="cards">
                  {assignments.map((assignment) => {
                    const active = assignment.id === selectedAssignment?.id;
                    const assignmentTotal = weightedTotal(
                      judgeScores[assignment.id] ?? getDefaultScores(assignment),
                    );

                    return (
                      <button
                        key={assignment.id}
                        type="button"
                        className={`project-card ${active ? "active" : ""}`}
                        onClick={() => setSelectedAssignmentId(assignment.id)}
                      >
                        <div className="project-card-top">
                          <div>
                            <strong>{assignment.title}</strong>
                            <p>{assignment.teamName}</p>
                          </div>
                          <span className="badge subtle-badge">{assignment.track ?? "General"}</span>
                        </div>
                        <p className="summary">{assignment.summary}</p>
                        <div className="project-meta">
                          <span>{assignment.stage ?? "Scoring"}</span>
                          <span>{assignmentTotal.toFixed(2)} / 5.00</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="detail-grid">
                <article className="panel detail-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Project detail</p>
                      <h2>{selectedAssignment?.title ?? "No assignment selected"}</h2>
                    </div>
                    <span className="badge">{selectedAssignment?.teamName ?? "Team"}</span>
                  </div>

                  {selectedAssignment ? (
                    <>
                      <p className="summary">{selectedAssignment.description ?? selectedAssignment.summary}</p>
                      <div className="detail-links">
                        {selectedAssignment.repoUrl ? (
                          <span className="chip">Repo linked</span>
                        ) : (
                          <span className="chip muted">Repo unavailable</span>
                        )}
                        {selectedAssignment.demoUrl ? (
                          <span className="chip">Demo linked</span>
                        ) : (
                          <span className="chip muted">Demo unavailable</span>
                        )}
                        <span className="chip">{selectedAssignment.track ?? "General"}</span>
                      </div>

                      <div className="total-banner">
                        <div>
                          <span className="label">Weighted total</span>
                          <strong>{total.toFixed(2)} / 5.00</strong>
                        </div>
                        <p className="subtle">
                          Slider values are stored locally and recalculate the weighted score live.
                        </p>
                      </div>
                    </>
                  ) : null}
                </article>

                <article className="panel scoring-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Scoring</p>
                      <h2>Weighted rubric</h2>
                    </div>
                    <span className="badge">1 to 5</span>
                  </div>

                  <div className="criteria-list">
                    {CRITERIA.map((criterion) => {
                      const value = currentScores[criterion.key];
                      const fill = ((value - 1) / 4) * 100;

                      return (
                        <div key={criterion.key} className="criterion">
                          <div className="criterion-top">
                            <div>
                              <strong>{criterion.label}</strong>
                              <p>{criterion.helper}</p>
                            </div>
                            <span className="chip weight-chip">{Math.round(criterion.weight * 100)}%</span>
                          </div>
                          <div className="slider-row">
                            <span className="slider-label">1</span>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              step={1}
                              value={value}
                              onChange={(event) => updateScore(criterion.key, Number(event.target.value))}
                              style={
                                {
                                  ["--fill" as never]: `${fill}%`,
                                } as CSSProperties
                              }
                            />
                            <span className="slider-label">
                              {value} {SCORE_LABELS[value]}
                            </span>
                          </div>
                          <label className="criterion-comment">
                            <span>Comment</span>
                            <textarea
                              rows={2}
                              value={criterionComments[selectedAssignment?.id ?? ""]?.[criterion.key] ?? ""}
                              onChange={(event) =>
                                updateCriterionComment(criterion.key, event.target.value)
                              }
                              placeholder="Optional note for this criterion."
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <label className="comment-field">
                    <span>Comments</span>
                    <textarea
                      rows={4}
                      value={judgeComments[selectedAssignment?.id ?? ""] ?? ""}
                      onChange={(event) => updateComment(event.target.value)}
                      placeholder="Leave a concise scoring note."
                    />
                  </label>
                </article>
              </div>
            </section>
          ) : (
            <section className="builder-layout">
              <article className="panel builder-main">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Team checklist</p>
                    <h2>Submission readiness</h2>
                  </div>
                  <span className="badge">{readinessPercent}% ready</span>
                </div>

                <div className="checklist">
                  {builderItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`checklist-item ${item.done ? "done" : ""}`}
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      <div className="checkmark" aria-hidden="true">
                        {item.done ? "✓" : ""}
                      </div>
                      <div className="checktext">
                        <strong>{item.label}</strong>
                        <p>{item.detail ?? "Complete this item before launch."}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="status-grid">
                  <div className="status-card">
                    <span className="label">Invite status</span>
                    <strong>{inviteLabel(session.inviteStatus as Assignment["inviteStatus"])}</strong>
                    <p className="subtle">
                      {session.role === "builder"
                        ? "Access is tied to a verified invite from the organizer."
                        : "Organizer authorization is required for admin access."}
                    </p>
                  </div>
                  <div className="status-card">
                    <span className="label">Launch readiness</span>
                    <strong>{builderItems.every((item) => item.done) ? "Ready" : "In progress"}</strong>
                    <p className="subtle">{completedChecklist} of {builderItems.length} checklist items complete.</p>
                  </div>
                </div>
              </article>

              <article className="panel invite-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Invite status</p>
                    <h2>Participant access</h2>
                  </div>
                  <span className="badge">Local mock state</span>
                </div>

                <div className="invite-form">
                  <label>
                    <span>Email or username</span>
                    <input
                      type="text"
                      value={inviteValue}
                      onChange={(event) => setInviteValue(event.target.value)}
                      placeholder="name@team.com"
                    />
                  </label>
                  <label>
                    <span>Role</span>
                    <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Role)}>
                      <option value="builder">Builder</option>
                      <option value="judge">Judge</option>
                    </select>
                  </label>
                  <label>
                    <span>Invite state</span>
                    <select
                      value={inviteStatus}
                      onChange={(event) =>
                        setInviteStatus(event.target.value as Assignment["inviteStatus"])
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      setLaunchNote(
                        `Invite prepared for ${inviteValue || "new participant"} as ${inviteRole}. Status: ${inviteLabel(inviteStatus)}.`,
                      )
                    }
                  >
                    Prepare invite
                  </button>
                </div>

                <div className="invite-summary">
                  <span className="label">Launch note</span>
                  <p>{launchNote}</p>
                </div>
              </article>
            </section>
          )}
        </main>
      </div>

      <style>{`
        .workspace {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(31, 78, 216, 0.08), transparent 30%),
            radial-gradient(circle at 80% 10%, rgba(15, 118, 110, 0.08), transparent 24%),
            #f7f7f4;
          color: #111827;
        }

        .shell {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .rail,
        .panel {
          border: 1px solid #d7dee7;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 48px rgba(17, 24, 39, 0.06);
        }

        .rail {
          position: sticky;
          top: 24px;
          align-self: start;
          padding: 24px;
          display: grid;
          gap: 16px;
        }

        .brand-block h1,
        .section-head h2 {
          margin: 0;
          font-family: "Instrument Serif", Georgia, serif;
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          line-height: 0.96;
          color: #111827;
        }

        .eyebrow,
        .label {
          display: inline-block;
          font-size: 0.74rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5b6472;
        }

        .subtle,
        .summary,
        .criterion-top p,
        .checktext p,
        .invite-summary p {
          margin: 0;
          color: #5b6472;
          line-height: 1.55;
        }

        .panel {
          padding: 24px;
        }

        .content {
          min-width: 0;
        }

        .judge-layout,
        .builder-layout {
          display: grid;
          gap: 20px;
        }

        .judge-layout {
          grid-template-columns: minmax(260px, 0.92fr) minmax(0, 1.08fr);
        }

        .builder-layout {
          grid-template-columns: minmax(0, 1.1fr) 380px;
          align-items: start;
        }

        .project-list,
        .detail-grid,
        .cards,
        .criteria-list,
        .checklist,
        .status-grid {
          display: grid;
          gap: 14px;
        }

        .detail-grid {
          grid-template-columns: minmax(0, 1fr);
        }

        .project-card,
        .criterion,
        .checklist-item,
        .status-card,
        .invite-summary {
          border: 1px solid #d7dee7;
          border-radius: 18px;
          background: #ffffff;
        }

        .project-card,
        .checklist-item {
          width: 100%;
          text-align: left;
          padding: 18px;
          cursor: pointer;
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
          color: inherit;
        }

        .project-card:hover,
        .checklist-item:hover {
          border-color: #b9c7d8;
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
          transform: translateY(-1px);
        }

        .project-card.active {
          border-color: #1f4ed8;
          box-shadow: 0 0 0 1px rgba(31, 78, 216, 0.14);
        }

        .project-card-top,
        .section-head,
        .criterion-top,
        .project-meta,
        .total-banner,
        .checklist-item,
        .status-grid,
        .invite-form,
        .project-card {
          display: flex;
          gap: 12px;
        }

        .project-card-top,
        .section-head,
        .criterion-top,
        .total-banner {
          justify-content: space-between;
          align-items: start;
        }

        .project-card p,
        .checktext p {
          margin-top: 6px;
        }

        .project-meta {
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          font-size: 0.88rem;
          color: #5b6472;
        }

        .badge,
        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          background: #eef1f4;
          color: #111827;
        }

        .subtle-badge,
        .weight-chip,
        .muted {
          background: #f3f5f8;
          color: #5b6472;
        }

        .total-banner {
          margin-top: 16px;
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(31, 78, 216, 0.08), rgba(15, 118, 110, 0.06));
          border: 1px solid rgba(31, 78, 216, 0.12);
        }

        .total-banner strong {
          display: block;
          margin-top: 4px;
          font-family: "Instrument Serif", Georgia, serif;
          font-size: 2rem;
        }

        .criteria-list {
          margin-top: 6px;
        }

        .criterion {
          padding: 16px;
        }

        .slider-row {
          display: grid;
          grid-template-columns: 20px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          margin-top: 14px;
        }

        .slider-row input[type="range"] {
          width: 100%;
          appearance: none;
          height: 10px;
          border-radius: 999px;
          outline: none;
          background: linear-gradient(
            90deg,
            #1f4ed8 0 var(--fill),
            #e5ebf1 var(--fill) 100%
          );
        }

        .slider-row input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #1f4ed8;
          box-shadow: 0 4px 10px rgba(17, 24, 39, 0.12);
        }

        .comment-field {
          display: grid;
          gap: 8px;
          margin-top: 18px;
        }

        .criterion-comment {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .criterion-comment textarea {
          min-height: 72px;
        }

        textarea,
        input,
        select {
          width: 100%;
          border: 1px solid #d7dee7;
          border-radius: 14px;
          padding: 12px 14px;
          background: #ffffff;
          color: #111827;
          font: inherit;
        }

        textarea:focus,
        input:focus,
        select:focus {
          outline: 2px solid rgba(31, 78, 216, 0.16);
          border-color: #1f4ed8;
        }

        .invite-form {
          flex-direction: column;
          margin-top: 6px;
        }

        .invite-form label,
        .comment-field {
          display: grid;
          gap: 8px;
        }

        .primary-button {
          border: 0;
          border-radius: 999px;
          padding: 12px 16px;
          background: #1f4ed8;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(31, 78, 216, 0.18);
        }

        .checklist {
          margin-top: 6px;
        }

        .checklist-item {
          align-items: center;
          text-align: left;
        }

        .checklist-item.done {
          border-color: rgba(21, 128, 61, 0.4);
          background: linear-gradient(135deg, rgba(21, 128, 61, 0.06), #ffffff);
        }

        .checkmark {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          background: #eef1f4;
          color: #15803d;
          font-weight: 700;
        }

        .checklist-item.done .checkmark {
          background: rgba(21, 128, 61, 0.12);
        }

        .checktext strong {
          display: block;
        }

        .status-grid {
          margin-top: 16px;
        }

        .status-card,
        .invite-summary {
          padding: 16px;
        }

        .invite-summary {
          margin-top: 18px;
        }

        @media (max-width: 1080px) {
          .shell,
          .judge-layout,
          .builder-layout {
            grid-template-columns: 1fr;
          }

          .rail {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .workspace {
            padding: 16px;
          }

          .panel,
          .rail {
            padding: 18px;
          }

          .project-card-top,
          .section-head,
          .criterion-top,
          .total-banner,
          .status-grid {
            flex-direction: column;
          }

          .slider-row {
            grid-template-columns: 20px minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
