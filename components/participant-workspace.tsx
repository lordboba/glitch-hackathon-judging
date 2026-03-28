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
            <span className="brand-name">glitch<span className="brand-accent">_</span>graders</span>
            <p className="rail-meta">
              {session.hackathonName ?? "Hackathon"} · {session.userName}
            </p>
          </div>

          <div className="rail-panel">
            <span className="rail-label">Role</span>
            <strong>{session.role === "judge" ? "Judge" : "Builder"}</strong>
          </div>

          <div className="rail-panel">
            <span className="rail-label">Status</span>
            <strong>{inviteLabel(session.inviteStatus as Assignment["inviteStatus"])}</strong>
          </div>

          {session.role === "judge" && (
            <div className="rail-panel">
              <span className="rail-label">Queue</span>
              <strong>{assignments.length} projects</strong>
            </div>
          )}
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
                            <p className="card-team">{assignment.teamName}</p>
                          </div>
                          <span className="score-pill">{assignmentTotal.toFixed(1)}</span>
                        </div>
                        <p className="card-summary">{assignment.summary}</p>
                        <div className="card-footer">
                          <span className="badge">{assignment.track ?? "General"}</span>
                          <span className="card-stage">{assignment.stage ?? "Scoring"}</span>
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
                      <p className="detail-desc">{selectedAssignment.description ?? selectedAssignment.summary}</p>
                      <div className="detail-chips">
                        {selectedAssignment.repoUrl ? (
                          <span className="chip">Repo linked</span>
                        ) : (
                          <span className="chip chip-muted">Repo unavailable</span>
                        )}
                        {selectedAssignment.demoUrl ? (
                          <span className="chip">Demo linked</span>
                        ) : (
                          <span className="chip chip-muted">Demo unavailable</span>
                        )}
                        <span className="chip">{selectedAssignment.track ?? "General"}</span>
                      </div>

                      <div className="total-banner">
                        <div>
                          <span className="total-label">Weighted total</span>
                          <span className="total-value">{total.toFixed(2)}</span>
                        </div>
                        <span className="total-max">/ 5.00</span>
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
                    <span className="badge">1–5</span>
                  </div>

                  <div className="criteria-list">
                    {CRITERIA.map((criterion) => {
                      const value = currentScores[criterion.key];
                      const fill = ((value - 1) / 4) * 100;

                      return (
                        <div key={criterion.key} className="criterion">
                          <div className="criterion-header">
                            <div className="criterion-info">
                              <strong>{criterion.label}</strong>
                              <span className="criterion-weight">{Math.round(criterion.weight * 100)}%</span>
                            </div>
                            <span className="criterion-value">{value}</span>
                          </div>
                          <p className="criterion-helper">{criterion.helper}</p>
                          <div className="slider-row">
                            <span className="slider-min">1</span>
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
                            <span className="slider-max">5</span>
                          </div>
                          <span className="score-label-text">{SCORE_LABELS[value]}</span>
                          <label className="criterion-comment">
                            <textarea
                              rows={2}
                              value={criterionComments[selectedAssignment?.id ?? ""]?.[criterion.key] ?? ""}
                              onChange={(event) =>
                                updateCriterionComment(criterion.key, event.target.value)
                              }
                              placeholder="Optional note..."
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <label className="comment-field">
                    <span>Overall comments</span>
                    <textarea
                      rows={3}
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
                  <span className="badge">{readinessPercent}%</span>
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
                    <span className="rail-label">Invite status</span>
                    <strong>{inviteLabel(session.inviteStatus as Assignment["inviteStatus"])}</strong>
                  </div>
                  <div className="status-card">
                    <span className="rail-label">Readiness</span>
                    <strong>{builderItems.every((item) => item.done) ? "Ready" : "In progress"}</strong>
                    <p className="card-summary">{completedChecklist} of {builderItems.length} complete</p>
                  </div>
                </div>
              </article>

              <article className="panel invite-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Invite management</p>
                    <h2>Participant access</h2>
                  </div>
                  <span className="badge">Local mock</span>
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
                    className="primary-btn"
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
                  <span className="rail-label">Launch note</span>
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
          background: #ffffff;
          color: #0f172a;
          font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
        }

        .shell {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ---- Rail ---- */
        .rail {
          position: sticky;
          top: 24px;
          align-self: start;
          display: grid;
          gap: 12px;
        }

        .brand-block {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #0f172a;
          color: #f8fafc;
        }

        .brand-name {
          font-family: "JetBrains Mono", monospace;
          font-size: 16px;
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
        }

        .brand-accent {
          color: #2563eb;
        }

        .rail-meta {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
        }

        .rail-panel {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
        }

        .rail-label {
          display: block;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .rail-panel strong {
          font-size: 14px;
        }

        /* ---- Layout ---- */
        .content { min-width: 0; }

        .panel {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          padding: 24px;
        }

        .eyebrow {
          margin: 0 0 4px;
          color: #2563eb;
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 4px;
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          font-weight: 500;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        /* ---- Judge layout ---- */
        .judge-layout {
          display: grid;
          grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
          gap: 20px;
        }

        .project-list,
        .detail-grid,
        .cards,
        .criteria-list,
        .checklist,
        .status-grid {
          display: grid;
          gap: 12px;
        }

        .project-card {
          width: 100%;
          text-align: left;
          padding: 16px;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: inherit;
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }

        .project-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }

        .project-card.active {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px #2563eb;
        }

        .project-card-top {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 12px;
        }

        .project-card-top strong {
          font-size: 15px;
          display: block;
        }

        .card-team {
          margin: 2px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .score-pill {
          font-family: "JetBrains Mono", monospace;
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
          flex-shrink: 0;
        }

        .card-summary {
          margin: 10px 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-stage {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          color: #94a3b8;
        }

        /* ---- Detail panel ---- */
        .detail-desc {
          margin: 0 0 16px;
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }

        .detail-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .chip {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .chip-muted {
          color: #94a3b8;
        }

        .total-banner {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 16px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .total-label {
          display: block;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          margin-bottom: 4px;
        }

        .total-value {
          font-family: "JetBrains Mono", monospace;
          font-size: 32px;
          font-weight: 600;
          color: #0f172a;
        }

        .total-max {
          font-family: "JetBrains Mono", monospace;
          font-size: 14px;
          color: #94a3b8;
        }

        /* ---- Scoring panel ---- */
        .criterion {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .criterion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .criterion-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .criterion-info strong {
          font-size: 14px;
        }

        .criterion-weight {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          color: #94a3b8;
        }

        .criterion-value {
          font-family: "JetBrains Mono", monospace;
          font-size: 22px;
          font-weight: 600;
          color: #2563eb;
        }

        .criterion-helper {
          margin: 0 0 12px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        .slider-row {
          display: grid;
          grid-template-columns: 20px minmax(0, 1fr) 20px;
          gap: 10px;
          align-items: center;
        }

        .slider-min,
        .slider-max {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }

        .slider-row input[type="range"] {
          width: 100%;
          appearance: none;
          height: 6px;
          border: none;
          padding: 0;
          border-radius: 999px;
          outline: none;
          background: linear-gradient(
            90deg,
            #2563eb 0 var(--fill),
            #e2e8f0 var(--fill) 100%
          );
        }

        .slider-row input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #2563eb;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
          cursor: pointer;
        }

        .slider-row input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #2563eb;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
          cursor: pointer;
        }

        .score-label-text {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #2563eb;
          margin-top: 6px;
          text-align: center;
        }

        .criterion-comment {
          display: grid;
          gap: 4px;
          margin-top: 12px;
        }

        .criterion-comment textarea {
          min-height: 56px;
        }

        .comment-field {
          display: grid;
          gap: 6px;
          margin-top: 16px;
        }

        .comment-field span {
          font-size: 13px;
          font-weight: 500;
        }

        textarea,
        input,
        select {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          font-size: 14px;
        }

        textarea:focus,
        input:focus,
        select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        /* ---- Builder layout ---- */
        .builder-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) 360px;
          gap: 20px;
          align-items: start;
        }

        .checklist { margin-top: 4px; }

        .checklist-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          padding: 14px;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          color: inherit;
          transition: border-color 140ms ease;
        }

        .checklist-item:hover {
          border-color: #cbd5e1;
        }

        .checklist-item.done {
          border-color: #bbf7d0;
          background: #f0fdf4;
        }

        .checkmark {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          background: #f1f5f9;
          color: #16a34a;
          font-size: 13px;
          font-weight: 700;
        }

        .checklist-item.done .checkmark {
          background: #dcfce7;
        }

        .checktext strong {
          display: block;
          font-size: 14px;
        }

        .checktext p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .status-grid {
          margin-top: 16px;
          grid-template-columns: 1fr 1fr;
        }

        .status-card {
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .status-card strong {
          display: block;
          font-size: 14px;
        }

        .invite-form {
          display: grid;
          gap: 12px;
          margin-top: 4px;
        }

        .invite-form label {
          display: grid;
          gap: 4px;
        }

        .invite-form label span {
          font-size: 13px;
          font-weight: 500;
        }

        .primary-btn {
          border: 0;
          border-radius: 8px;
          padding: 10px 16px;
          background: #0f172a;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 140ms ease;
        }

        .primary-btn:hover {
          background: #1e293b;
        }

        .invite-summary {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .invite-summary p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #475569;
        }

        /* ---- Responsive ---- */
        @media (max-width: 1080px) {
          .shell,
          .judge-layout,
          .builder-layout {
            grid-template-columns: 1fr;
          }

          .rail {
            position: static;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 720px) {
          .workspace { padding: 12px; }

          .panel { padding: 16px; }

          .section-head {
            flex-direction: column;
          }

          .status-grid {
            grid-template-columns: 1fr;
          }

          .total-banner {
            flex-direction: column;
            gap: 4px;
          }

          .slider-row input[type="range"]::-webkit-slider-thumb {
            width: 28px;
            height: 28px;
          }

          .slider-row input[type="range"]::-moz-range-thumb {
            width: 28px;
            height: 28px;
          }

          .criterion {
            padding: 20px;
          }

          .slider-row {
            gap: 14px;
          }

          .criterion-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}
