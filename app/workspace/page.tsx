import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import JudgeDashboard from "@/components/judge-dashboard";
import { getSession } from "@/lib/auth";
import { getJudgeWorkspace } from "@/lib/server/scoring";

export const dynamic = "force-dynamic";

function noticeFromSaved(value?: string) {
  switch (value) {
    case "draft":
      return "Draft scorecard saved.";
    case "submitted":
      return "Scorecard submitted and locked.";
    default:
      return undefined;
  }
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();

  if (!session || session.role !== "judge") {
    redirect("/join");
  }

  const params = await searchParams;
  const eventId = typeof params.eventId === "string" ? params.eventId : undefined;
  const saved = typeof params.saved === "string" ? params.saved : undefined;
  const workspace = await getJudgeWorkspace(session.id, eventId);

  return (
    <main className="workspace-shell">
      <header className="workspace-topbar">
        <div>
          <p className="eyebrow">Judge workspace</p>
          <h1>Assigned scorecards</h1>
        </div>
        <div className="utility-cluster">
          <span className="utility-pill utility-pill-strong">
            {session.name} · judge
          </span>
          <form action={signOut}>
            <button className="button button-ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <JudgeDashboard
        assignments={workspace.assignments}
        events={workspace.events.map((event) => ({ id: event.id, name: event.name }))}
        notice={noticeFromSaved(saved)}
        selectedEvent={workspace.selectedEvent}
      />
    </main>
  );
}
