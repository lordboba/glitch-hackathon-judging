"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { persistAssignmentPlan } from "@/lib/server/assignments";
import { requireSessionUser } from "@/lib/server/auth";
import {
  createEvent,
  createJudgeInvite,
  revokeInvite,
  updateEvent,
  updateProjectReview,
} from "@/lib/server/events";
import { publishLeaderboard } from "@/lib/server/leaderboard";

function adminRedirect(eventId: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({ eventId, ...extra });
  redirect(`/admin?${params.toString()}`);
}

export async function createEventAction(formData: FormData) {
  await requireSessionUser("admin");

  const event = await createEvent({
    name: String(formData.get("name") || ""),
    hostOrganization: String(formData.get("hostOrganization") || ""),
    format: String(formData.get("format") || ""),
    audience: String(formData.get("audience") || ""),
    timezone: String(formData.get("timezone") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    location: String(formData.get("location") || ""),
    tracks: String(formData.get("tracks") || ""),
    organizerGoal: String(formData.get("organizerGoal") || ""),
  });

  revalidatePath("/admin");
  adminRedirect(event.id);
}

export async function updateEventAction(formData: FormData) {
  await requireSessionUser("admin");

  const eventId = String(formData.get("eventId") || "");

  await updateEvent({
    eventId,
    name: String(formData.get("name") || ""),
    hostOrganization: String(formData.get("hostOrganization") || ""),
    format: String(formData.get("format") || ""),
    audience: String(formData.get("audience") || ""),
    status: String(formData.get("status") || "DRAFT"),
    timezone: String(formData.get("timezone") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    location: String(formData.get("location") || ""),
    tracks: String(formData.get("tracks") || ""),
    organizerGoal: String(formData.get("organizerGoal") || ""),
    judgeCount: Number(formData.get("judgeCount") || 0),
  });

  revalidatePath("/admin");
  adminRedirect(eventId, { saved: "event" });
}

export async function createInviteAction(formData: FormData) {
  await requireSessionUser("admin");

  const eventId = String(formData.get("eventId") || "");
  const code = await createJudgeInvite({
    eventId,
    email: String(formData.get("email") || ""),
    label: String(formData.get("label") || ""),
    track: String(formData.get("track") || ""),
    code: String(formData.get("code") || ""),
  });

  revalidatePath("/admin");
  adminRedirect(eventId, { inviteCode: code });
}

export async function revokeInviteAction(formData: FormData) {
  await requireSessionUser("admin");

  const eventId = String(formData.get("eventId") || "");
  const inviteId = String(formData.get("inviteId") || "");

  await revokeInvite(inviteId);
  revalidatePath("/admin");
  adminRedirect(eventId, { saved: "invite" });
}

export async function saveAssignmentPolicyAction(formData: FormData) {
  const admin = await requireSessionUser("admin");
  const eventId = String(formData.get("eventId") || "");

  await persistAssignmentPlan(eventId, admin.id, {
    scope: String(formData.get("scope") || "all") as "all" | "top20" | "topN",
    topN: Number(formData.get("topN") || 5),
    minimumJudges: Number(formData.get("minimumJudges") || 2),
    preferTrackJudges: formData.get("preferTrackJudges") === "on",
    keepExistingAssignments: formData.get("keepExistingAssignments") === "on",
  });

  revalidatePath("/admin");
  adminRedirect(eventId, { saved: "assignments" });
}

export async function updateProjectReviewAction(formData: FormData) {
  await requireSessionUser("admin");

  const eventId = String(formData.get("eventId") || "");

  await updateProjectReview({
    projectId: String(formData.get("projectId") || ""),
    manualAdjustment: Number(formData.get("manualAdjustment") || 0),
    tieBreakerNote: String(formData.get("tieBreakerNote") || ""),
  });

  revalidatePath("/admin");
  adminRedirect(eventId, { saved: "project" });
}

export async function finalizeLeaderboardAction(formData: FormData) {
  const admin = await requireSessionUser("admin");
  const eventId = String(formData.get("eventId") || "");

  await publishLeaderboard(eventId, admin.id);
  revalidatePath("/admin");
  adminRedirect(eventId, { saved: "leaderboard" });
}
