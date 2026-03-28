import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import { createEventAction } from "@/app/admin/actions";
import { getSession } from "@/lib/auth";
import { listEvents } from "@/lib/server/events";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/admin/access");
  }

  const events = await listEvents();

  return (
    <main className="workspace-shell">
      <header className="workspace-topbar">
        <div>
          <p className="eyebrow">Organizer workspace</p>
          <h1>glitch<span style={{ color: "var(--accent)" }}>_</span>graders</h1>
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

      <section className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Events</p>
            <h2>Your hackathons</h2>
          </div>
          <span className="badge">{events.length} events</span>
        </div>

        {events.length > 0 ? (
          <div className="admin-grid-two" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/${event.id}`}
                className="card"
                style={{ textDecoration: "none", transition: "border-color 140ms ease", cursor: "pointer" }}
              >
                <div className="section-header">
                  <div>
                    <p className="eyebrow">{event.format}</p>
                    <h3>{event.name}</h3>
                  </div>
                  <span className="badge">{event.status}</span>
                </div>
                <p className="subtle-text" style={{ marginBottom: 12 }}>
                  {event.startDate} — {event.endDate} · {event.location}
                </p>
                <div className="utility-cluster">
                  <span className="utility-pill">{event.projectCount} projects</span>
                  <span className="utility-pill">{event.judgeCount} judges</span>
                  <span className="utility-pill">{event.inviteCount} invites</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="subtle-text">No events yet. Create one below.</p>
        )}
      </section>

      <section className="card admin-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">New event</p>
            <h3>Create a hackathon</h3>
          </div>
        </div>
        <form action={createEventAction} className="stack-form">
          <div className="admin-grid-two">
            <label>
              <span>Name</span>
              <input name="name" placeholder="Campus Sprint Weekend" required type="text" />
            </label>
            <label>
              <span>Host organization</span>
              <input name="hostOrganization" placeholder="Your organization" required type="text" />
            </label>
            <label>
              <span>Format</span>
              <select defaultValue="hybrid" name="format">
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </label>
            <label>
              <span>Audience</span>
              <select defaultValue="invited" name="audience">
                <option value="invited">Invited</option>
                <option value="application">Application</option>
                <option value="public">Public</option>
              </select>
            </label>
            <label>
              <span>Timezone</span>
              <input name="timezone" placeholder="America/Los_Angeles" required type="text" />
            </label>
            <label>
              <span>Location</span>
              <input name="location" placeholder="San Francisco, CA" required type="text" />
            </label>
            <label>
              <span>Start date</span>
              <input name="startDate" required type="date" />
            </label>
            <label>
              <span>End date</span>
              <input name="endDate" required type="date" />
            </label>
          </div>
          <label>
            <span>Tracks</span>
            <input
              name="tracks"
              placeholder="Developer Tools, Climate, Healthcare"
              required
              type="text"
            />
          </label>
          <label>
            <span>Organizer goal</span>
            <textarea name="organizerGoal" rows={3} />
          </label>
          <button className="button button-primary" type="submit">
            Create event
          </button>
        </form>
      </section>
    </main>
  );
}
