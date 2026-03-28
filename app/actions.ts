"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { participantInviteDirectory } from "@/lib/mock-data";
import { sessionCookieKeys } from "@/lib/auth";

async function setSessionCookies(params: { role: string; name: string; email: string }) {
  const store = await cookies();
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  store.set(sessionCookieKeys.role, params.role, baseOptions);
  store.set(sessionCookieKeys.name, params.name, baseOptions);
  store.set(sessionCookieKeys.email, params.email, baseOptions);
}

export async function authorizeAdmin(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const code = String(formData.get("authorizationCode") || "").trim();
  const expectedCode = process.env.ADMIN_AUTH_CODE ?? "ORBIT-ADMIN-2026";

  if (!name || !email || !code) {
    redirect("/admin/access?error=missing_fields");
  }

  if (code !== expectedCode) {
    redirect("/admin/access?error=invalid_code");
  }

  await setSessionCookies({ role: "admin", name, email });
  redirect("/admin");
}

export async function joinWithInvite(formData: FormData) {
  const code = String(formData.get("inviteCode") || "")
    .trim()
    .toUpperCase();

  const invite = participantInviteDirectory.find((item) => item.code === code);

  if (!invite) {
    redirect("/join?error=invalid_invite");
  }

  const fallbackName = invite.email.split("@")[0].replace(/[.-]/g, " ");
  const name = fallbackName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  await setSessionCookies({ role: invite.role, name, email: invite.email });
  redirect("/workspace");
}

export async function signOut() {
  const store = await cookies();
  store.delete(sessionCookieKeys.role);
  store.delete(sessionCookieKeys.name);
  store.delete(sessionCookieKeys.email);
  redirect("/");
}
