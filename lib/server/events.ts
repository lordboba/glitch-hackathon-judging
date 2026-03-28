import { InviteCodeStatus, UserRole } from "@prisma/client";

import { normalizeAssignmentPolicy } from "@/lib/server/assignments";
import { ensureBootstrapData } from "@/lib/server/bootstrap";
import { defaultEventConfig, sampleJudges } from "@/lib/server/defaults";
import { generateOpaqueToken, hashSecret, slugify } from "@/lib/server/crypto";
import { prisma } from "@/lib/server/db";
import { getPublishedLeaderboard, computeLiveLeaderboard } from "@/lib/server/leaderboard";

function formatEventForForm(event: {
  id: string;
  name: string;
  slug: string;
  hostOrganization: string;
  format: string;
  audience: string;
  status: string;
  timezone: string;
  startDate: Date;
  endDate: Date;
  location: string;
  tracks: string[];
  organizerGoal: string;
  judgeCount: number;
}) {
  return {
    ...event,
    startDate: event.startDate.toISOString().slice(0, 10),
    endDate: event.endDate.toISOString().slice(0, 10),
  };
}

export async function listOpenJudgeInvites() {
  await ensureBootstrapData();

  const invites = await prisma.inviteCode.findMany({
    where: {
      role: UserRole.JUDGE,
      status: InviteCodeStatus.SENT,
    },
    include: {
      event: true,
    },
    orderBy: [{ event: { startDate: "asc" } }, { email: "asc" }],
    take: 8,
  });

  return invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    label: invite.label,
    track: invite.track,
    eventName: invite.event.name,
    demoCode:
      sampleJudges.find((sampleJudge) => sampleJudge.email === invite.email)?.code ?? "Stored hashed",
  }));
}

export async function getHomepageData() {
  await ensureBootstrapData();

  const [sessionEvent, openInvites] = await Promise.all([
    prisma.event.findFirst({
      orderBy: { startDate: "asc" },
    }),
    listOpenJudgeInvites(),
  ]);

  return {
    event: sessionEvent ? formatEventForForm(sessionEvent) : null,
    openInvites,
  };
}

export async function createEvent(input: {
  name: string;
  hostOrganization: string;
  format: string;
  audience: string;
  timezone: string;
  startDate: string;
  endDate: string;
  location: string;
  tracks: string;
  organizerGoal: string;
}) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Event name is required");
  }

  return prisma.event.create({
    data: {
      ...defaultEventConfig,
      name,
      slug: slugify(name),
      hostOrganization: input.hostOrganization.trim() || defaultEventConfig.hostOrganization,
      format: input.format || defaultEventConfig.format,
      audience: input.audience || defaultEventConfig.audience,
      timezone: input.timezone || defaultEventConfig.timezone,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      location: input.location.trim() || defaultEventConfig.location,
      tracks: input.tracks
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      organizerGoal: input.organizerGoal.trim() || defaultEventConfig.organizerGoal,
    },
  });
}

export async function updateEvent(input: {
  eventId: string;
  name: string;
  hostOrganization: string;
  format: string;
  audience: string;
  status: string;
  timezone: string;
  startDate: string;
  endDate: string;
  location: string;
  tracks: string;
  organizerGoal: string;
  judgeCount: number;
}) {
  return prisma.event.update({
    where: { id: input.eventId },
    data: {
      name: input.name.trim(),
      slug: slugify(input.name),
      hostOrganization: input.hostOrganization.trim(),
      format: input.format,
      audience: input.audience,
      status: input.status as "DRAFT" | "OPEN_INTAKE" | "JUDGING_LIVE" | "COMPLETED",
      timezone: input.timezone,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      location: input.location.trim(),
      tracks: input.tracks
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      organizerGoal: input.organizerGoal.trim(),
      judgeCount: Number(input.judgeCount),
    },
  });
}

export async function createJudgeInvite(input: {
  eventId: string;
  email: string;
  label: string;
  track: string;
  code?: string;
}) {
  const code = input.code?.trim().toUpperCase() || `JUDGE-${generateOpaqueToken().slice(0, 10).toUpperCase()}`;

  await prisma.inviteCode.create({
    data: {
      eventId: input.eventId,
      codeHash: hashSecret(code),
      role: UserRole.JUDGE,
      email: input.email.trim().toLowerCase(),
      label: input.label.trim() || "Judge invite",
      track: input.track.trim() || null,
      status: InviteCodeStatus.SENT,
    },
  });

  return code;
}

export async function revokeInvite(inviteId: string) {
  return prisma.inviteCode.update({
    where: { id: inviteId },
    data: {
      status: InviteCodeStatus.REVOKED,
    },
  });
}

export async function updateProjectReview(input: {
  projectId: string;
  manualAdjustment: number;
  tieBreakerNote: string;
}) {
  return prisma.project.update({
    where: { id: input.projectId },
    data: {
      manualAdjustment: Number(input.manualAdjustment),
      tieBreakerNote: input.tieBreakerNote.trim(),
    },
  });
}

export async function getAdminDashboardData(selectedEventId?: string) {
  await ensureBootstrapData();

  const events = await prisma.event.findMany({
    orderBy: [{ startDate: "asc" }, { name: "asc" }],
  });

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;

  if (!selectedEvent) {
    return {
      events: [],
      selectedEvent: null,
      invites: [],
      judges: [],
      projects: [],
      liveLeaderboard: [],
      publishedLeaderboard: null,
      assignmentPolicy: normalizeAssignmentPolicy(null),
    };
  }

  const [invites, judges, projects, liveLeaderboard, publishedLeaderboard] = await Promise.all([
    prisma.inviteCode.findMany({
      where: { eventId: selectedEvent.id },
      orderBy: [{ status: "asc" }, { email: "asc" }],
    }),
    prisma.eventParticipant.findMany({
      where: {
        eventId: selectedEvent.id,
        role: UserRole.JUDGE,
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
    prisma.project.findMany({
      where: {
        eventId: selectedEvent.id,
      },
      include: {
        links: true,
        assignments: {
          include: {
            judgeUser: true,
          },
        },
        scorecards: true,
      },
      orderBy: [{ screeningScore: "desc" }, { projectName: "asc" }],
    }),
    computeLiveLeaderboard(selectedEvent.id),
    getPublishedLeaderboard(selectedEvent.id),
  ]);

  return {
    events: events.map(formatEventForForm),
    selectedEvent: formatEventForForm(selectedEvent),
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      label: invite.label,
      track: invite.track,
      status: invite.status,
      redeemedAt: invite.redeemedAt,
    })),
    judges: judges.map((participant) => ({
      id: participant.userId,
      name: participant.user.name,
      email: participant.user.email,
      track: participant.track,
      assignmentCapacity: participant.assignmentCapacity ?? 5,
      assignmentCount: projects.filter((project) =>
        project.assignments.some((assignment) => assignment.judgeUserId === participant.userId),
      ).length,
    })),
    projects: projects.map((project) => ({
      id: project.id,
      projectName: project.projectName,
      teamName: project.teamName,
      track: project.track,
      status: project.status,
      description: project.description,
      screeningScore: project.screeningScore,
      manualAdjustment: project.manualAdjustment,
      tieBreakerNote: project.tieBreakerNote,
      repoUrl: project.links.find((link) => link.type === "REPO")?.url ?? "",
      demoUrl: project.links.find((link) => link.type === "DEMO")?.url ?? "",
      submissionUrl: project.links.find((link) => link.type === "SUBMISSION")?.url ?? "",
      assignedJudges: project.assignments.map((assignment) => assignment.judgeUser.name),
      submittedScorecards: project.scorecards.filter((scorecard) => scorecard.status === "SUBMITTED")
        .length,
    })),
    liveLeaderboard,
    publishedLeaderboard,
    assignmentPolicy: normalizeAssignmentPolicy(selectedEvent.assignmentPolicy as object | null),
  };
}
