import { ScorecardStatus, SnapshotStatus } from "@prisma/client";

import { prisma } from "@/lib/server/db";
import { weightedTotal } from "@/lib/server/rubric";
import type { LeaderboardEntry } from "@/lib/server/types";

export function rankLeaderboardEntries(entries: Omit<LeaderboardEntry, "rank">[]): LeaderboardEntry[] {
  return [...entries]
    .sort((left, right) => {
      return (
        right.finalScore - left.finalScore ||
        (right.screeningScore ?? 0) - (left.screeningScore ?? 0) ||
        left.projectName.localeCompare(right.projectName)
      );
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export async function computeLiveLeaderboard(eventId: string) {
  const projects = await prisma.project.findMany({
    where: { eventId },
    include: {
      scorecards: {
        where: {
          status: ScorecardStatus.SUBMITTED,
        },
      },
    },
    orderBy: [{ screeningScore: "desc" }, { projectName: "asc" }],
  });

  return rankLeaderboardEntries(
    projects.map((project) => {
      const submittedTotals = project.scorecards.map((scorecard) =>
        weightedTotal({
          innovation: scorecard.innovationScore,
          execution: scorecard.executionScore,
          impact: scorecard.impactScore,
          design: scorecard.designScore,
          demo: scorecard.demoScore,
        }),
      );
      const averageScore =
        submittedTotals.length === 0
          ? 0
          : submittedTotals.reduce((sum, total) => sum + total, 0) / submittedTotals.length;

      return {
        projectId: project.id,
        projectName: project.projectName,
        teamName: project.teamName,
        track: project.track,
        submittedScorecards: submittedTotals.length,
        averageScore: Number(averageScore.toFixed(2)),
        screeningScore: project.screeningScore,
        manualAdjustment: project.manualAdjustment,
        finalScore: Number((averageScore + project.manualAdjustment).toFixed(2)),
        tieBreakerNote: project.tieBreakerNote,
        status: project.status,
      };
    }),
  );
}

export async function getPublishedLeaderboard(eventId: string) {
  const snapshot = await prisma.leaderboardSnapshot.findFirst({
    where: {
      eventId,
      status: SnapshotStatus.PUBLISHED,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!snapshot) {
    return null;
  }

  return {
    id: snapshot.id,
    createdAt: snapshot.createdAt,
    entries: snapshot.payload as LeaderboardEntry[],
  };
}

export async function publishLeaderboard(eventId: string, generatedByUserId: string) {
  const entries = await computeLiveLeaderboard(eventId);

  const snapshot = await prisma.leaderboardSnapshot.create({
    data: {
      eventId,
      generatedByUserId,
      status: SnapshotStatus.PUBLISHED,
      payload: entries,
    },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: {
      publishedLeaderboardAt: snapshot.createdAt,
    },
  });

  return {
    id: snapshot.id,
    entries,
  };
}
