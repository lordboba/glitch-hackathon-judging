import {
  AdminAccessCodeStatus,
  InviteCodeStatus,
  LinkType,
  ProjectStatus,
  ScorecardStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/server/db";
import { defaultEventConfig, sampleJudges, sampleProjects } from "@/lib/server/defaults";
import { hashSecret, slugify } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { emptyScorecard } from "@/lib/server/rubric";

let bootstrapPromise: Promise<void> | null = null;

async function seedProjects(eventId: string, judgeIdsByTrack: Record<string, string>, adminUserId: string) {
  for (const project of sampleProjects) {
    const record = await prisma.project.upsert({
      where: {
        eventId_projectName_teamName: {
          eventId,
          projectName: project.projectName,
          teamName: project.teamName,
        },
      },
      update: {
        slug: slugify(project.projectName),
        track: project.track,
        description: project.description,
        screeningScore: project.screeningScore,
        status: project.status as ProjectStatus,
      },
      create: {
        eventId,
        slug: slugify(project.projectName),
        projectName: project.projectName,
        teamName: project.teamName,
        track: project.track,
        description: project.description,
        screeningScore: project.screeningScore,
        status: project.status as ProjectStatus,
      },
    });

    const linkWrites = [
      { type: LinkType.REPO, url: project.repoUrl },
      { type: LinkType.DEMO, url: project.demoUrl },
      { type: LinkType.SUBMISSION, url: project.submissionUrl },
    ].filter((item) => item.url);

    for (const link of linkWrites) {
      await prisma.projectLink.upsert({
        where: {
          projectId_type: {
            projectId: record.id,
            type: link.type,
          },
        },
        update: { url: link.url },
        create: {
          projectId: record.id,
          type: link.type,
          url: link.url,
        },
      });
    }

    const judgeUserId = judgeIdsByTrack[project.track] ?? Object.values(judgeIdsByTrack)[0];

    if (!judgeUserId) {
      continue;
    }

    await prisma.projectAssignment.upsert({
      where: {
        projectId_judgeUserId: {
          projectId: record.id,
          judgeUserId,
        },
      },
      update: {
        assignedByUserId: adminUserId,
      },
      create: {
        projectId: record.id,
        judgeUserId,
        assignedByUserId: adminUserId,
      },
    });

    const demoScorecard = emptyScorecard();

    await prisma.scorecard.upsert({
      where: {
        projectId_judgeUserId: {
          projectId: record.id,
          judgeUserId,
        },
      },
      update: {
        status: project.projectName === "Atlas Relay" ? ScorecardStatus.SUBMITTED : ScorecardStatus.DRAFT,
        innovationScore: demoScorecard.innovation + 1,
        executionScore: demoScorecard.execution + 1,
        impactScore: demoScorecard.impact,
        designScore: demoScorecard.design,
        demoScore: demoScorecard.demo,
        overallComment:
          project.projectName === "Atlas Relay"
            ? "Strong technical credibility and a very clear operational use case."
            : "",
        submittedAt: project.projectName === "Atlas Relay" ? new Date() : null,
      },
      create: {
        projectId: record.id,
        judgeUserId,
        status: project.projectName === "Atlas Relay" ? ScorecardStatus.SUBMITTED : ScorecardStatus.DRAFT,
        innovationScore: demoScorecard.innovation + 1,
        executionScore: demoScorecard.execution + 1,
        impactScore: demoScorecard.impact,
        designScore: demoScorecard.design,
        demoScore: demoScorecard.demo,
        overallComment:
          project.projectName === "Atlas Relay"
            ? "Strong technical credibility and a very clear operational use case."
            : "",
        submittedAt: project.projectName === "Atlas Relay" ? new Date() : null,
      },
    });
  }
}

async function bootstrap() {
  const adminCodeHash = hashSecret(env.adminAuthCode.trim());

  const existingAccessCode = await prisma.adminAccessCode.findUnique({
    where: { codeHash: adminCodeHash },
  });

  if (!existingAccessCode) {
    await prisma.adminAccessCode.create({
      data: {
        codeHash: adminCodeHash,
        label: "Default organizer access",
        status: AdminAccessCodeStatus.ACTIVE,
      },
    });
  }

  const event =
    (await prisma.event.findFirst({
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.event.create({
      data: {
        ...defaultEventConfig,
        status: "JUDGING_LIVE",
      },
    }));

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@glitchgraders.dev" },
    update: {
      name: "Demo Admin",
      role: UserRole.ADMIN,
    },
    create: {
      email: "admin@glitchgraders.dev",
      name: "Demo Admin",
      role: UserRole.ADMIN,
    },
  });

  await prisma.eventParticipant.upsert({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: adminUser.id,
      },
    },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      eventId: event.id,
      userId: adminUser.id,
      role: UserRole.ADMIN,
    },
  });

  const judgeIdsByTrack: Record<string, string> = {};

  for (const sampleJudge of sampleJudges) {
    const user = await prisma.user.upsert({
      where: { email: sampleJudge.email },
      update: {
        name: sampleJudge.name,
        role: UserRole.JUDGE,
      },
      create: {
        email: sampleJudge.email,
        name: sampleJudge.name,
        role: UserRole.JUDGE,
      },
    });

    judgeIdsByTrack[sampleJudge.track] = user.id;

    await prisma.eventParticipant.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: user.id,
        },
      },
      update: {
        role: UserRole.JUDGE,
        track: sampleJudge.track,
        assignmentCapacity: sampleJudge.assignmentCapacity,
      },
      create: {
        eventId: event.id,
        userId: user.id,
        role: UserRole.JUDGE,
        track: sampleJudge.track,
        assignmentCapacity: sampleJudge.assignmentCapacity,
      },
    });

    await prisma.inviteCode.upsert({
      where: {
        codeHash: hashSecret(sampleJudge.code),
      },
      update: {
        eventId: event.id,
        role: UserRole.JUDGE,
        email: sampleJudge.email,
        label: sampleJudge.label,
        track: sampleJudge.track,
        status: InviteCodeStatus.SENT,
        redeemedAt: null,
        redeemedByUserId: null,
      },
      create: {
        eventId: event.id,
        codeHash: hashSecret(sampleJudge.code),
        role: UserRole.JUDGE,
        email: sampleJudge.email,
        label: sampleJudge.label,
        track: sampleJudge.track,
        status: InviteCodeStatus.SENT,
      },
    });
  }

  await seedProjects(event.id, judgeIdsByTrack, adminUser.id);
}

export async function ensureBootstrapData() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}
