import { ScorecardStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/server/db";
import { clampScore, emptyScorecard, weightedTotal } from "@/lib/server/rubric";
import type { ScorecardInput } from "@/lib/server/types";

function normalizeInput(input: Partial<ScorecardInput>): ScorecardInput {
  const base = emptyScorecard();

  return {
    innovation: clampScore(Number(input.innovation ?? base.innovation)),
    execution: clampScore(Number(input.execution ?? base.execution)),
    impact: clampScore(Number(input.impact ?? base.impact)),
    design: clampScore(Number(input.design ?? base.design)),
    demo: clampScore(Number(input.demo ?? base.demo)),
    innovationComment: String(input.innovationComment ?? ""),
    executionComment: String(input.executionComment ?? ""),
    impactComment: String(input.impactComment ?? ""),
    designComment: String(input.designComment ?? ""),
    demoComment: String(input.demoComment ?? ""),
    overallComment: String(input.overallComment ?? ""),
  };
}

function linkMapFromLinks(links: Array<{ type: "REPO" | "DEMO" | "SUBMISSION"; url: string }>) {
  return {
    repoUrl: links.find((link) => link.type === "REPO")?.url ?? "",
    demoUrl: links.find((link) => link.type === "DEMO")?.url ?? "",
    submissionUrl: links.find((link) => link.type === "SUBMISSION")?.url ?? "",
  };
}

export async function saveScorecardDraft(
  judgeUserId: string,
  projectId: string,
  input: Partial<ScorecardInput>,
) {
  const assignment = await prisma.projectAssignment.findUnique({
    where: {
      projectId_judgeUserId: {
        projectId,
        judgeUserId,
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const existing = await prisma.scorecard.findUnique({
    where: {
      projectId_judgeUserId: {
        projectId,
        judgeUserId,
      },
    },
  });

  if (existing?.status === ScorecardStatus.SUBMITTED) {
    throw new Error("Submitted scorecards are read-only");
  }

  const normalized = normalizeInput(input);

  return prisma.scorecard.upsert({
    where: {
      projectId_judgeUserId: {
        projectId,
        judgeUserId,
      },
    },
    update: {
      status: ScorecardStatus.DRAFT,
      innovationScore: normalized.innovation,
      executionScore: normalized.execution,
      impactScore: normalized.impact,
      designScore: normalized.design,
      demoScore: normalized.demo,
      innovationComment: normalized.innovationComment,
      executionComment: normalized.executionComment,
      impactComment: normalized.impactComment,
      designComment: normalized.designComment,
      demoComment: normalized.demoComment,
      overallComment: normalized.overallComment,
      submittedAt: null,
    },
    create: {
      projectId,
      judgeUserId,
      status: ScorecardStatus.DRAFT,
      innovationScore: normalized.innovation,
      executionScore: normalized.execution,
      impactScore: normalized.impact,
      designScore: normalized.design,
      demoScore: normalized.demo,
      innovationComment: normalized.innovationComment,
      executionComment: normalized.executionComment,
      impactComment: normalized.impactComment,
      designComment: normalized.designComment,
      demoComment: normalized.demoComment,
      overallComment: normalized.overallComment,
    },
  });
}

export async function submitScorecard(
  judgeUserId: string,
  projectId: string,
  input: Partial<ScorecardInput>,
) {
  const existing = await prisma.scorecard.findUnique({
    where: {
      projectId_judgeUserId: {
        projectId,
        judgeUserId,
      },
    },
  });

  if (existing?.status === ScorecardStatus.SUBMITTED) {
    throw new Error("Submitted scorecards are read-only");
  }

  const normalized = normalizeInput(input);

  return prisma.scorecard.upsert({
    where: {
      projectId_judgeUserId: {
        projectId,
        judgeUserId,
      },
    },
    update: {
      status: ScorecardStatus.SUBMITTED,
      innovationScore: normalized.innovation,
      executionScore: normalized.execution,
      impactScore: normalized.impact,
      designScore: normalized.design,
      demoScore: normalized.demo,
      innovationComment: normalized.innovationComment,
      executionComment: normalized.executionComment,
      impactComment: normalized.impactComment,
      designComment: normalized.designComment,
      demoComment: normalized.demoComment,
      overallComment: normalized.overallComment,
      submittedAt: new Date(),
    },
    create: {
      projectId,
      judgeUserId,
      status: ScorecardStatus.SUBMITTED,
      innovationScore: normalized.innovation,
      executionScore: normalized.execution,
      impactScore: normalized.impact,
      designScore: normalized.design,
      demoScore: normalized.demo,
      innovationComment: normalized.innovationComment,
      executionComment: normalized.executionComment,
      impactComment: normalized.impactComment,
      designComment: normalized.designComment,
      demoComment: normalized.demoComment,
      overallComment: normalized.overallComment,
      submittedAt: new Date(),
    },
  });
}

export async function getJudgeWorkspace(userId: string, eventId?: string) {
  const memberships = await prisma.eventParticipant.findMany({
    where: {
      userId,
      role: UserRole.JUDGE,
    },
    include: {
      event: true,
    },
    orderBy: {
      event: {
        startDate: "asc",
      },
    },
  });

  const selectedMembership =
    memberships.find((membership) => membership.eventId === eventId) ?? memberships[0] ?? null;

  if (!selectedMembership) {
    return {
      events: [],
      selectedEvent: null,
      assignments: [],
    };
  }

  const assignments = await prisma.projectAssignment.findMany({
    where: {
      judgeUserId: userId,
      project: {
        eventId: selectedMembership.eventId,
      },
    },
    include: {
      project: {
        include: {
          links: true,
          scorecards: {
            where: {
              judgeUserId: userId,
            },
          },
        },
      },
    },
    orderBy: {
      project: {
        screeningScore: "desc",
      },
    },
  });

  return {
    events: memberships.map((membership) => membership.event),
    selectedEvent: selectedMembership.event,
    assignments: assignments.map((assignment) => {
      const scorecard = assignment.project.scorecards[0];
      const input = scorecard
        ? {
            innovation: scorecard.innovationScore,
            execution: scorecard.executionScore,
            impact: scorecard.impactScore,
            design: scorecard.designScore,
            demo: scorecard.demoScore,
            innovationComment: scorecard.innovationComment,
            executionComment: scorecard.executionComment,
            impactComment: scorecard.impactComment,
            designComment: scorecard.designComment,
            demoComment: scorecard.demoComment,
            overallComment: scorecard.overallComment,
          }
        : emptyScorecard();

      return {
        id: assignment.project.id,
        title: assignment.project.projectName,
        teamName: assignment.project.teamName,
        track: assignment.project.track,
        description: assignment.project.description,
        status: assignment.project.status,
        scorecardStatus: scorecard?.status ?? ScorecardStatus.DRAFT,
        weightedTotal: weightedTotal(input),
        submittedAt: scorecard?.submittedAt ?? null,
        links: linkMapFromLinks(
          assignment.project.links.map((link) => ({
            type: link.type,
            url: link.url,
          })),
        ),
        scorecard: input,
      };
    }),
  };
}
