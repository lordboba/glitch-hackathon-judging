import { prisma } from "@/lib/server/db";
import {
  knownPlaceholderEmailDomains,
  knownPlaceholderLinkPrefixes,
  knownPlaceholderProjectNames,
  knownPlaceholderTeamNames,
  listMatchingPlaceholderEventFields,
} from "@/lib/server/event-config";

async function main() {
  const [events, projects, projectLinks, users, invites] = await Promise.all([
    prisma.event.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        hostOrganization: true,
        timezone: true,
        startDate: true,
        endDate: true,
        location: true,
        tracks: true,
        organizerGoal: true,
      },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { projectName: { in: [...knownPlaceholderProjectNames] } },
          { teamName: { in: [...knownPlaceholderTeamNames] } },
        ],
      },
      select: {
        id: true,
        eventId: true,
        projectName: true,
        teamName: true,
      },
      orderBy: [{ projectName: "asc" }, { teamName: "asc" }],
    }),
    prisma.projectLink.findMany({
      where: {
        OR: knownPlaceholderLinkPrefixes.map((prefix) => ({
          url: { startsWith: prefix },
        })),
      },
      select: {
        id: true,
        type: true,
        url: true,
        project: {
          select: {
            eventId: true,
            projectName: true,
            teamName: true,
          },
        },
      },
      orderBy: [{ url: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        OR: knownPlaceholderEmailDomains.map((domain) => ({
          email: { endsWith: `@${domain}` },
        })),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: [{ email: "asc" }],
    }),
    prisma.inviteCode.findMany({
      where: {
        OR: knownPlaceholderEmailDomains.map((domain) => ({
          email: { endsWith: `@${domain}` },
        })),
      },
      select: {
        id: true,
        eventId: true,
        email: true,
        label: true,
        track: true,
        status: true,
      },
      orderBy: [{ email: "asc" }],
    }),
  ]);

  const placeholderEvents = events
    .map((event) => ({
      ...event,
      matchedFields: listMatchingPlaceholderEventFields(event),
    }))
    .filter((event) => event.matchedFields.length > 0);

  const report = {
    summary: {
      placeholderEvents: placeholderEvents.length,
      placeholderProjects: projects.length,
      placeholderProjectLinks: projectLinks.length,
      placeholderUsers: users.length,
      placeholderInvites: invites.length,
    },
    placeholderEvents,
    placeholderProjects: projects,
    placeholderProjectLinks: projectLinks,
    placeholderUsers: users,
    placeholderInvites: invites,
  };

  const totalFindings = Object.values(report.summary).reduce((sum, count) => sum + count, 0);

  if (totalFindings === 0) {
    console.log("No placeholder candidates found.");
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
