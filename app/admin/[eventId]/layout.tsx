import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { getEventSummary } from "@/lib/server/events";
import EventNav from "./event-nav";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "", label: "Overview" },
  { href: "/config", label: "Config" },
  { href: "/invites", label: "Invites" },
  { href: "/judges", label: "Judges" },
  { href: "/rankings", label: "Rankings" },
  { href: "/publish", label: "Publish" },
];

export default async function EventLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/access");
  }

  const { eventId } = await params;
  const event = await getEventSummary(eventId);

  if (!event) {
    redirect("/admin");
  }

  return (
    <div className="event-layout">
      <aside className="event-sidebar">
        <div className="event-sidebar-header">
          <Link href="/admin" className="back-link">&larr; Events</Link>
          <h2 className="event-sidebar-title">{event.name}</h2>
          <span className="badge">{event.status}</span>
        </div>

        <EventNav eventId={eventId} items={NAV_ITEMS} />

        <div className="event-sidebar-stats">
          <div className="stat-row">
            <span>Projects</span>
            <strong>{event.projectCount}</strong>
          </div>
          <div className="stat-row">
            <span>Judges</span>
            <strong>{event.judgeCount}</strong>
          </div>
          <div className="stat-row">
            <span>Invites</span>
            <strong>{event.inviteCount}</strong>
          </div>
          <div className="stat-row">
            <span>Scorecards</span>
            <strong>{event.submittedScorecards}</strong>
          </div>
        </div>

        <div className="event-sidebar-user">
          <span className="subtle-text">{session.name} · admin</span>
          <form action={signOut}>
            <button className="button button-ghost" type="submit" style={{ padding: "6px 12px", minHeight: "auto", fontSize: 13 }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="event-main">
        {children}
      </main>

      <style>{`
        .event-layout {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          min-height: 100vh;
          background: #ffffff;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
        }

        .event-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .event-sidebar-header {
          display: grid;
          gap: 8px;
        }

        .back-link {
          font-family: "JetBrains Mono", monospace;
          font-size: 12px;
          color: #2563eb;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .event-sidebar-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .event-sidebar .badge {
          width: fit-content;
        }

        .event-nav {
          display: grid;
          gap: 2px;
        }

        .event-nav a {
          display: block;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: background 100ms ease, color 100ms ease;
        }

        .event-nav a:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .event-nav a.active {
          background: #0f172a;
          color: #ffffff;
        }

        .event-sidebar-stats {
          display: grid;
          gap: 6px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .stat-row span {
          color: #64748b;
        }

        .stat-row strong {
          font-family: "JetBrains Mono", monospace;
          font-size: 13px;
          color: #0f172a;
        }

        .event-sidebar-user {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .event-main {
          padding: 32px;
          max-width: 960px;
        }

        @media (max-width: 900px) {
          .event-layout {
            grid-template-columns: 1fr;
          }

          .event-sidebar {
            position: static;
            height: auto;
            border-right: 0;
            border-bottom: 1px solid #e2e8f0;
            padding: 16px;
          }

          .event-nav {
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          }

          .event-sidebar-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .event-main {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  );
}
