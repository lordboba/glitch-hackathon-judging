import { InviteCodeStatus, UserRole } from "@prisma/client";

import { normalizeAssignmentPolicy } from "@/lib/server/assignments";
import { ensureBootstrapData } from "@/lib/server/bootstrap";
import { generateOpaqueToken, hashSecret, slugify } from "@/lib/server/crypto";
import { prisma } from "@/lib/server/db";
import {
  eventSystemDefaults,
  parseRequiredDate,
  parseTrackList,
  requireText,
} from "@/lib/server/event-config";
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
  const name = requireText(input.name, "Event name");
  const hostOrganization = requireText(input.hostOrganization, "Host organization");
  const timezone = requireText(input.timezone, "Timezone");
  const location = requireText(input.location, "Location");
  const tracks = parseTrackList(input.tracks);

  if (!tracks.length) {
    throw new Error("At least one track is required");
  }

  return prisma.event.create({
    data: {
      ...eventSystemDefaults,
      name,
      slug: slugify(name),
      hostOrganization,
      format: input.format || eventSystemDefaults.format,
      audience: input.audience || eventSystemDefaults.audience,
      timezone,
      startDate: parseRequiredDate(input.startDate, "Start date"),
      endDate: parseRequiredDate(input.endDate, "End date"),
      location,
      tracks,
      organizerGoal: input.organizerGoal.trim(),
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
  const name = requireText(input.name, "Event name");
  const hostOrganization = requireText(input.hostOrganization, "Host organization");
  const timezone = requireText(input.timezone, "Timezone");
  const location = requireText(input.location, "Location");
  const tracks = parseTrackList(input.tracks);

  if (!tracks.length) {
    throw new Error("At least one track is required");
  }

  return prisma.event.update({
    where: { id: input.eventId },
    data: {
      name,
      slug: slugify(name),
      hostOrganization,
      format: input.format,
      audience: input.audience,
      status: input.status as "DRAFT" | "OPEN_INTAKE" | "JUDGING_LIVE" | "COMPLETED",
      timezone,
      startDate: parseRequiredDate(input.startDate, "Start date"),
      endDate: parseRequiredDate(input.endDate, "End date"),
      location,
      tracks,
      organizerGoal: input.organizerGoal.trim(),
      judgeCount: Math.max(0, Number(input.judgeCount) || 0),
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

export async function listEvents() {
  await ensureBootstrapData();

  const events = await prisma.event.findMany({
    orderBy: [{ startDate: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          projects: true,
          participants: { where: { role: UserRole.JUDGE } },
          inviteCodes: true,
        },
      },
    },
  });

  return events.map((event) => ({
    ...formatEventForForm(event),
    projectCount: event._count.projects,
    judgeCount: event._count.participants,
    inviteCount: event._count.inviteCodes,
  }));
}

export async function getEventSummary(eventId: string) {
  await ensureBootstrapData();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: {
          projects: true,
          participants: { where: { role: UserRole.JUDGE } },
          inviteCodes: true,
        },
      },
    },
  });

  if (!event) return null;

  const submittedScorecards = await prisma.scorecard.count({
    where: {
      project: { eventId },
      status: "SUBMITTED",
    },
  });

  return {
    ...formatEventForForm(event),
    projectCount: event._count.projects,
    judgeCount: event._count.participants,
    inviteCount: event._count.inviteCodes,
    submittedScorecards,
  };
}

export async function getEventConfig(eventId: string) {
  await ensureBootstrapData();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;

  return formatEventForForm(event);
}

export async function getEventInvites(eventId: string) {
  const invites = await prisma.inviteCode.findMany({
    where: { eventId },
    orderBy: [{ status: "asc" }, { email: "asc" }],
  });

  return invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    label: invite.label,
    track: invite.track,
    status: invite.status,
    redeemedAt: invite.redeemedAt,
  }));
}

export async function getEventJudges(eventId: string) {
  const [judges, projects] = await Promise.all([
    prisma.eventParticipant.findMany({
      where: { eventId, role: UserRole.JUDGE },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.project.findMany({
      where: { eventId },
      include: { assignments: true },
    }),
  ]);

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  return {
    judges: judges.map((participant) => ({
      id: participant.userId,
      name: participant.user.name,
      email: participant.user.email,
      track: participant.track,
      assignmentCapacity: participant.assignmentCapacity ?? 5,
      assignmentCount: projects.filter((project) =>
        project.assignments.some((a) => a.judgeUserId === participant.userId),
      ).length,
    })),
    assignmentPolicy: normalizeAssignmentPolicy(
      event?.assignmentPolicy as object | null,
    ),
  };
}

export async function getEventProjects(eventId: string) {
  const projects = await prisma.project.findMany({
    where: { eventId },
    include: {
      links: true,
      assignments: { include: { judgeUser: true } },
      scorecards: true,
    },
    orderBy: [{ screeningScore: "desc" }, { projectName: "asc" }],
  });

  return projects.map((project) => ({
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
    assignedJudges: project.assignments.map((a) => a.judgeUser.name),
    submittedScorecards: project.scorecards.filter((s) => s.status === "SUBMITTED").length,
  }));
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
