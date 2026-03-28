"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionUser } from "@/lib/server/auth";
import { saveScorecardDraft, submitScorecard } from "@/lib/server/scoring";

function readScore(formData: FormData, key: string) {
  return Number(formData.get(key) || 3);
}

function scorecardInputFromFormData(formData: FormData) {
  return {
    innovation: readScore(formData, "innovation"),
    execution: readScore(formData, "execution"),
    impact: readScore(formData, "impact"),
    design: readScore(formData, "design"),
    demo: readScore(formData, "demo"),
    innovationComment: String(formData.get("innovationComment") || ""),
    executionComment: String(formData.get("executionComment") || ""),
    impactComment: String(formData.get("impactComment") || ""),
    designComment: String(formData.get("designComment") || ""),
    demoComment: String(formData.get("demoComment") || ""),
    overallComment: String(formData.get("overallComment") || ""),
  };
}

export async function saveScorecardDraftAction(formData: FormData) {
  const session = await requireSessionUser("judge");

  await saveScorecardDraft(
    session.id,
    String(formData.get("projectId") || ""),
    scorecardInputFromFormData(formData),
  );

  revalidatePath("/workspace");
  redirect("/workspace?saved=draft");
}

export async function submitScorecardAction(formData: FormData) {
  const session = await requireSessionUser("judge");

  await submitScorecard(
    session.id,
    String(formData.get("projectId") || ""),
    scorecardInputFromFormData(formData),
  );

  revalidatePath("/workspace");
  redirect("/workspace?saved=submitted");
}
