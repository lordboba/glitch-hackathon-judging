import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import AdminDashboard from "@/components/admin-dashboard";
import { getSession } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/server/events";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/admin/access");
  }

  const params = await searchParams;
  const eventId = typeof params.eventId === "string" ? params.eventId : undefined;
  const saved = typeof params.saved === "string" ? params.saved : undefined;
  const inviteCode = typeof params.inviteCode === "string" ? params.inviteCode : undefined;
  const dashboard = await getAdminDashboardData(eventId);

  return (
    <main className="workspace-shell">
      <header className="workspace-topbar">
        <div>
          <p className="eyebrow">Organizer workspace</p>
          <h1>Hackathon configuration and scoring ops</h1>
        </div>
        <div className="utility-cluster">
          <span className="utility-pill utility-pill-strong">
            {session.name} · admin
          </span>
          <form action={signOut}>
            <button className="button button-ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <AdminDashboard
        assignmentPolicy={dashboard.assignmentPolicy}
        events={dashboard.events}
        invites={dashboard.invites}
        judges={dashboard.judges}
        liveLeaderboard={dashboard.liveLeaderboard}
        projects={dashboard.projects}
        publishedLeaderboard={dashboard.publishedLeaderboard}
        queryState={{ saved, inviteCode }}
        selectedEvent={dashboard.selectedEvent}
      />
    </main>
  );
}
