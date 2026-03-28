import Link from "next/link";

import { authorizeAdmin } from "@/app/actions";

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
        <h1>Special access is required before someone becomes an admin.</h1>
        <p className="lede">
          This route represents the extra organizer gate. In this mockup, the code is validated
          server-side and the resulting admin session is stored in secure cookies.
        </p>
        <div className="info-block">
          <span>Demo code</span>
          <code>ORBIT-ADMIN-2026</code>
        </div>
        <Link className="text-link" href="/">
          Back to overview
        </Link>
      </section>

      <section className="access-card">
        <p className="eyebrow">Organizer sign-in</p>
        <h2>Enter the organizer identity and authorization code.</h2>
        {message ? <p className="inline-error">{message}</p> : null}
        <form action={authorizeAdmin} className="stack-form">
          <label>
            <span>Organizer name</span>
            <input name="name" placeholder="Morgan Patel" required type="text" />
          </label>
          <label>
            <span>Work email</span>
            <input name="email" placeholder="morgan@signaljury.dev" required type="email" />
          </label>
          <label>
            <span>Authorization code</span>
            <input
              name="authorizationCode"
              placeholder="ORBIT-ADMIN-2026"
              required
              type="password"
            />
          </label>
          <button className="button button-primary button-full" type="submit">
            Unlock organizer workspace
          </button>
        </form>
      </section>
    </main>
  );
}
