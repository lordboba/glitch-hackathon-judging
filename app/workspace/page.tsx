import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import ParticipantWorkspace from "@/components/participant-workspace";
import { getSession } from "@/lib/auth";
import {
  participantAssignments,
  participantBuilderChecklist,
} from "@/lib/mock-data";

export default async function WorkspacePage() {
  const session = await getSession();

  if (!session || (session.role !== "judge" && session.role !== "builder")) {
    redirect("/join");
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-topbar">
        <div>
          <p className="eyebrow">Participant workspace</p>
          <h1>{session.role === "judge" ? "Judge scoring desk" : "Builder submission desk"}</h1>
        </div>
        <div className="utility-cluster">
          <span className="utility-pill utility-pill-strong">
            {session.name} · {session.role}
          </span>
          <form action={signOut}>
            <button className="button button-ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <ParticipantWorkspace
        assignments={participantAssignments.map((assignment) => ({ ...assignment }))}
        builderChecklist={participantBuilderChecklist.map((item) => ({ ...item }))}
        session={{
          role: session.role,
          userName: session.name,
          orgName: "Signal Labs",
          hackathonName: "AI Builder Finals",
          teamName: session.role === "builder" ? "Northstar Labs" : undefined,
          inviteStatus: "verified",
          accessLabel:
            session.role === "judge"
              ? "Invite-verified judge access"
              : "Invite-verified builder access",
        }}
      />
    </main>
  );
}
