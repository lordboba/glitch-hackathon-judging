"use server";

import { redirect } from "next/navigation";

import { redeemJudgeInvite, signInAdmin, signOutCurrentSession } from "@/lib/server/auth";

export async function authorizeAdmin(formData: FormData) {
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const authorizationCode = String(formData.get("authorizationCode") || "");

  try {
    await signInAdmin({ name, email, authorizationCode });
  } catch (error) {
    if (error instanceof Error && error.message === "Missing fields") {
      redirect("/admin/access?error=missing_fields");
    }

    redirect("/admin/access?error=invalid_code");
  }

  redirect("/admin");
}

export async function joinWithInvite(formData: FormData) {
  const inviteCode = String(formData.get("inviteCode") || "");

  try {
    await redeemJudgeInvite(inviteCode);
  } catch {
    redirect("/join?error=invalid_invite");
  }

  redirect("/workspace");
}

export async function signOut() {
  await signOutCurrentSession();
  redirect("/");
}
