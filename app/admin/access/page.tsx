import Link from "next/link";

import { authorizeAdmin } from "@/app/actions";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

function getMessage(error?: string) {
  switch (error) {
    case "invalid_code":
      return "That organizer authorization code was rejected.";
    case "missing_fields":
      return "Name, email, and authorization code are all required.";
    default:
      return null;
  }
}

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = getMessage(error);

  return (
    <main className="access-shell">
      <section className="access-card access-card-emphasis">
        <p className="eyebrow">Organizer authorization</p>
        <h1>Admin access is validated against a database-backed access code.</h1>
        <p className="lede">
          The code is stored hashed in PostgreSQL, sessions are issued server-side, and only
          authenticated admins can reach the organizer area.
        </p>
        <div className="info-block">
          <span>Demo code</span>
          <code>{env.adminAuthCode}</code>
        </div>
        <Link className="text-link" href="/">
          &larr; Back to overview
        </Link>
      </section>

      <section className="access-card">
        <p className="eyebrow">Sign in</p>
        <h2>Enter your identity and authorization code.</h2>
        {message ? <p className="inline-error">{message}</p> : null}
        <form action={authorizeAdmin} className="stack-form">
          <label>
            <span>Organizer name</span>
            <input name="name" placeholder="Morgan Patel" required type="text" />
          </label>
          <label>
            <span>Work email</span>
            <input name="email" placeholder="morgan@glitchgraders.dev" required type="email" />
          </label>
          <label>
            <span>Authorization code</span>
            <input name="authorizationCode" placeholder="ORBIT-ADMIN-2026" required type="password" />
          </label>
          <button className="button button-primary button-full" type="submit">
            Unlock organizer workspace
          </button>
        </form>
      </section>
    </main>
  );
}
