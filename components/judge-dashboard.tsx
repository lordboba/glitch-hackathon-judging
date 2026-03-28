import Link from "next/link";

import { saveScorecardDraftAction, submitScorecardAction } from "@/app/workspace/actions";
import { RUBRIC, SCORE_LABELS } from "@/lib/server/rubric";

type Props = {
  notice?: string;
  events: Array<{
    id: string;
    name: string;
  }>;
  selectedEvent: {
    id: string;
    name: string;
    startDate: Date;
  } | null;
  assignments: Array<{
    id: string;
    title: string;
    teamName: string;
    track: string | null;
    description: string;
    status: string;
    scorecardStatus: string;
    weightedTotal: number;
    submittedAt: Date | null;
    links: {
      repoUrl: string;
      demoUrl: string;
      submissionUrl: string;
    };
    scorecard: {
      innovation: number;
      execution: number;
      impact: number;
      design: number;
      demo: number;
      innovationComment: string;
      executionComment: string;
      impactComment: string;
      designComment: string;
      demoComment: string;
      overallComment: string;
    };
  }>;
};

export default function JudgeDashboard({ notice, events, selectedEvent, assignments }: Props) {
  if (!selectedEvent) {
    return (
      <section className="card">
        <h2>No judge events assigned</h2>
        <p className="subtle-text">Ask an organizer to send you a valid judge invite code.</p>
      </section>
    );
  }

  return (
    <div className="judge-dashboard">
      <section className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Judge workspace</p>
            <h2>{selectedEvent.name}</h2>
          </div>
          <div className="utility-cluster">
            {events.map((event) => (
              <Link
                className={`utility-pill ${event.id === selectedEvent.id ? "utility-pill-strong" : ""}`}
                href={`/workspace?eventId=${event.id}`}
                key={event.id}
              >
                {event.name}
              </Link>
            ))}
          </div>
        </div>
        {notice ? <p className="inline-note">{notice}</p> : null}
      </section>

      <section className="admin-grid-one">
        {assignments.map((assignment) => (
          <article className="card admin-section" key={assignment.id}>
            <div className="section-header">
              <div>
                <p className="eyebrow">{assignment.track ?? "General"}</p>
                <h3>{assignment.title}</h3>
                <p className="subtle-text">{assignment.teamName}</p>
              </div>
              <div className="utility-cluster">
                <span className="badge">{assignment.status}</span>
                <span className="badge">
                  {assignment.scorecardStatus} · {assignment.weightedTotal.toFixed(2)} / 5.00
                </span>
              </div>
            </div>
            <p>{assignment.description}</p>
            <div className="utility-cluster">
              {assignment.links.repoUrl ? (
                <a className="text-link" href={assignment.links.repoUrl} rel="noreferrer" target="_blank">
                  Repo
                </a>
              ) : null}
              {assignment.links.demoUrl ? (
                <a className="text-link" href={assignment.links.demoUrl} rel="noreferrer" target="_blank">
                  Demo
                </a>
              ) : null}
              {assignment.links.submissionUrl ? (
                <a className="text-link" href={assignment.links.submissionUrl} rel="noreferrer" target="_blank">
                  Submission
                </a>
              ) : null}
            </div>

            <form action={saveScorecardDraftAction} className="stack-form">
              <input name="projectId" type="hidden" value={assignment.id} />
              <div className="score-grid">
                {RUBRIC.map((criterion) => (
                  <div className="list-panel" key={criterion.key}>
                    <label>
                      <span>
                        {criterion.label} ({Math.round(criterion.weight * 100)}%)
                      </span>
                      <select
                        defaultValue={assignment.scorecard[criterion.key]}
                        disabled={assignment.scorecardStatus === "SUBMITTED"}
                        name={criterion.key}
                      >
                        {Object.entries(SCORE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {value} - {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Notes</span>
                      <textarea
                        defaultValue={assignment.scorecard[`${criterion.key}Comment` as const]}
                        disabled={assignment.scorecardStatus === "SUBMITTED"}
                        name={`${criterion.key}Comment`}
                        rows={3}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <label>
                <span>Overall comment</span>
                <textarea
                  defaultValue={assignment.scorecard.overallComment}
                  disabled={assignment.scorecardStatus === "SUBMITTED"}
                  name="overallComment"
                  rows={4}
                />
              </label>

              <div className="cta-row">
                <button
                  className="button button-secondary"
                  disabled={assignment.scorecardStatus === "SUBMITTED"}
                  type="submit"
                >
                  Save draft
                </button>
                <button
                  className="button button-primary"
                  disabled={assignment.scorecardStatus === "SUBMITTED"}
                  formAction={submitScorecardAction}
                  type="submit"
                >
                  Submit scorecard
                </button>
              </div>
              {assignment.submittedAt ? (
                <p className="subtle-text">Submitted at {assignment.submittedAt.toLocaleString()}.</p>
              ) : null}
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
