import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/server/db";
import { DEFAULT_ASSIGNMENT_POLICY } from "@/lib/server/rubric";
import type { AssignmentPolicyInput } from "@/lib/server/types";

type AssignmentProject = {
  id: string;
  track: string | null;
  screeningScore: number | null;
  existingJudgeIds: string[];
};

type AssignmentJudge = {
  userId: string;
  name: string;
  track: string | null;
  capacity: number;
  currentAssignments: number;
};

export function normalizeAssignmentPolicy(
  value: Partial<AssignmentPolicyInput> | null | undefined,
): AssignmentPolicyInput {
  return {
    scope:
      value?.scope === "top20" || value?.scope === "topN" || value?.scope === "all"
        ? value.scope
        : DEFAULT_ASSIGNMENT_POLICY.scope,
    topN: Math.max(1, Number(value?.topN ?? DEFAULT_ASSIGNMENT_POLICY.topN)),
    minimumJudges: Math.max(
      1,
      Number(value?.minimumJudges ?? DEFAULT_ASSIGNMENT_POLICY.minimumJudges),
    ),
    preferTrackJudges: Boolean(
      value?.preferTrackJudges ?? DEFAULT_ASSIGNMENT_POLICY.preferTrackJudges,
    ),
    keepExistingAssignments: Boolean(
      value?.keepExistingAssignments ?? DEFAULT_ASSIGNMENT_POLICY.keepExistingAssignments,
    ),
  };
}

function selectProjects(projects: AssignmentProject[], policy: AssignmentPolicyInput) {
  const ranked = [...projects].sort((left, right) => {
    return (right.screeningScore ?? 0) - (left.screeningScore ?? 0) || left.id.localeCompare(right.id);
  });

  if (policy.scope === "all") {
    return ranked;
  }

  if (policy.scope === "top20") {
    return ranked.slice(0, 20);
  }

  return ranked.slice(0, policy.topN);
}

export function buildAssignmentPlan(projects: AssignmentProject[], judges: AssignmentJudge[], policyInput: Partial<AssignmentPolicyInput>) {
  const policy = normalizeAssignmentPolicy(policyInput);
  const selectedProjects = selectProjects(projects, policy);
  const judgeLoads: Record<string, number> = Object.fromEntries(
    judges.map((judge) => [judge.userId, policy.keepExistingAssignments ? judge.currentAssignments : 0]),
  );
  const assignmentMap: Record<string, string[]> = {};

  for (const project of selectedProjects) {
    const current = policy.keepExistingAssignments ? [...project.existingJudgeIds] : [];

    const judgePool = [...judges].sort((left, right) => {
      if (policy.preferTrackJudges) {
        const leftMatch = left.track === project.track ? 1 : 0;
        const rightMatch = right.track === project.track ? 1 : 0;

        if (leftMatch !== rightMatch) {
          return rightMatch - leftMatch;
        }
      }

      return judgeLoads[left.userId] - judgeLoads[right.userId] || left.name.localeCompare(right.name);
    });

    for (const judge of judgePool) {
      if (current.length >= policy.minimumJudges) {
        break;
      }

      if (current.includes(judge.userId)) {
        continue;
      }

      if (judgeLoads[judge.userId] >= judge.capacity) {
        continue;
      }

      current.push(judge.userId);
      judgeLoads[judge.userId] += 1;
    }

    assignmentMap[project.id] = current;
  }

  return {
    policy,
    selectedProjectIds: selectedProjects.map((project) => project.id),
    assignmentMap,
    judgeLoads,
  };
}

export async function persistAssignmentPlan(
  eventId: string,
  assignedByUserId: string,
  policyInput: Partial<AssignmentPolicyInput>,
) {
  const [projects, judges] = await Promise.all([
    prisma.project.findMany({
      where: { eventId },
      include: {
        assignments: true,
      },
      orderBy: [{ screeningScore: "desc" }, { projectName: "asc" }],
    }),
    prisma.eventParticipant.findMany({
      where: {
        eventId,
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
  ]);

  const assignmentPlan = buildAssignmentPlan(
    projects.map((project) => ({
      id: project.id,
      track: project.track,
      screeningScore: project.screeningScore,
      existingJudgeIds: project.assignments.map((assignment) => assignment.judgeUserId),
    })),
    judges.map((participant) => ({
      userId: participant.userId,
      name: participant.user.name,
      track: participant.track,
      capacity: participant.assignmentCapacity ?? 5,
      currentAssignments: projects.filter((project) =>
        project.assignments.some((assignment) => assignment.judgeUserId === participant.userId),
      ).length,
    })),
    policyInput,
  );

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        assignmentPolicy: assignmentPlan.policy,
      },
    });

    if (!assignmentPlan.policy.keepExistingAssignments) {
      await tx.projectAssignment.deleteMany({
        where: {
          project: {
            eventId,
          },
        },
      });
    }

    for (const [projectId, judgeUserIds] of Object.entries(assignmentPlan.assignmentMap)) {
      for (const judgeUserId of judgeUserIds) {
        await tx.projectAssignment.upsert({
          where: {
            projectId_judgeUserId: {
              projectId,
              judgeUserId,
            },
          },
          update: {
            assignedByUserId,
          },
          create: {
            projectId,
            judgeUserId,
            assignedByUserId,
          },
        });
      }
    }
  });

  return assignmentPlan;
}
