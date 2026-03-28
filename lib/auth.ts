import { cookies } from "next/headers";

import type { Session, UserRole } from "@/lib/mock-data";

const ROLE_COOKIE = "hackathon_role";
const NAME_COOKIE = "hackathon_name";
const EMAIL_COOKIE = "hackathon_email";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const role = store.get(ROLE_COOKIE)?.value as UserRole | undefined;
  const name = store.get(NAME_COOKIE)?.value;
  const email = store.get(EMAIL_COOKIE)?.value;

  if (!role || !name || !email) {
    return null;
  }

  return { role, name, email };
}

export const sessionCookieKeys = {
  role: ROLE_COOKIE,
  name: NAME_COOKIE,
  email: EMAIL_COOKIE,
};
