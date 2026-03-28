import { getSessionUser } from "@/lib/server/auth";

export async function getSession() {
  return getSessionUser();
}
