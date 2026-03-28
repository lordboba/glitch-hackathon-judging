import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import AdminPortal from "@/components/admin-portal";
import { getSession } from "@/lib/auth";
import { defaultHackathonConfig } from "@/lib/mock-data";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/admin/access");
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-topbar">
        <div>
          <p className="eyebrow">Organizer workspace</p>
          <h1>General hackathon configuration</h1>
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

      <AdminPortal initialConfig={defaultHackathonConfig} organizerName={session.name} />
    </main>
  );
}
