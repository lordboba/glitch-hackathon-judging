-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'JUDGE');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'OPEN_INTAKE', 'JUDGING_LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."InviteCodeStatus" AS ENUM ('SENT', 'REDEEMED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('READY', 'MISSING_VIDEO', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "public"."ImportStatus" AS ENUM ('PREVIEWED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."LinkType" AS ENUM ('REPO', 'DEMO', 'SUBMISSION');

-- CreateEnum
CREATE TYPE "public"."ScorecardStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "public"."SnapshotStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "public"."AdminAccessCodeStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAccessCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "public"."AdminAccessCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostOrganization" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "judgeAssignmentMode" TEXT NOT NULL,
    "scoringMode" TEXT NOT NULL,
    "judgingModel" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "maxTeams" INTEGER NOT NULL,
    "teamSizeMin" INTEGER NOT NULL,
    "teamSizeMax" INTEGER NOT NULL,
    "submissionWindowHours" INTEGER NOT NULL,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT false,
    "allowLateEdits" BOOLEAN NOT NULL DEFAULT false,
    "requirePortfolio" BOOLEAN NOT NULL DEFAULT false,
    "requireKyc" BOOLEAN NOT NULL DEFAULT false,
    "judgeCount" INTEGER NOT NULL DEFAULT 0,
    "mentorCount" INTEGER NOT NULL DEFAULT 0,
    "tracks" TEXT[],
    "participantRoles" TEXT[],
    "organizerGoal" TEXT NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'DRAFT',
    "assignmentPolicy" JSONB,
    "publishedLeaderboardAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "track" TEXT,
    "assignmentCapacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InviteCode" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "track" TEXT,
    "status" "public"."InviteCodeStatus" NOT NULL DEFAULT 'SENT',
    "redeemedByUserId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImportBatch" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "status" "public"."ImportStatus" NOT NULL DEFAULT 'PREVIEWED',
    "mappingConfig" JSONB NOT NULL,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "slug" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "track" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "screeningScore" DOUBLE PRECISION,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'READY',
    "manualAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tieBreakerNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "public"."LinkType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "judgeUserId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Scorecard" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "judgeUserId" TEXT NOT NULL,
    "status" "public"."ScorecardStatus" NOT NULL DEFAULT 'DRAFT',
    "innovationScore" INTEGER NOT NULL,
    "executionScore" INTEGER NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "designScore" INTEGER NOT NULL,
    "demoScore" INTEGER NOT NULL,
    "innovationComment" TEXT NOT NULL DEFAULT '',
    "executionComment" TEXT NOT NULL DEFAULT '',
    "impactComment" TEXT NOT NULL DEFAULT '',
    "designComment" TEXT NOT NULL DEFAULT '',
    "demoComment" TEXT NOT NULL DEFAULT '',
    "overallComment" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "status" "public"."SnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccessCode_codeHash_key" ON "public"."AdminAccessCode"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_idx" ON "public"."EventParticipant"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_eventId_userId_key" ON "public"."EventParticipant"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_codeHash_key" ON "public"."InviteCode"("codeHash");

-- CreateIndex
CREATE INDEX "InviteCode_eventId_idx" ON "public"."InviteCode"("eventId");

-- CreateIndex
CREATE INDEX "InviteCode_email_idx" ON "public"."InviteCode"("email");

-- CreateIndex
CREATE INDEX "ImportBatch_eventId_idx" ON "public"."ImportBatch"("eventId");

-- CreateIndex
CREATE INDEX "Project_eventId_idx" ON "public"."Project"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_eventId_projectName_teamName_key" ON "public"."Project"("eventId", "projectName", "teamName");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLink_projectId_type_key" ON "public"."ProjectLink"("projectId", "type");

-- CreateIndex
CREATE INDEX "ProjectAssignment_judgeUserId_idx" ON "public"."ProjectAssignment"("judgeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssignment_projectId_judgeUserId_key" ON "public"."ProjectAssignment"("projectId", "judgeUserId");

-- CreateIndex
CREATE INDEX "Scorecard_judgeUserId_idx" ON "public"."Scorecard"("judgeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Scorecard_projectId_judgeUserId_key" ON "public"."Scorecard"("projectId", "judgeUserId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_eventId_status_idx" ON "public"."LeaderboardSnapshot"("eventId", "status");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InviteCode" ADD CONSTRAINT "InviteCode_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InviteCode" ADD CONSTRAINT "InviteCode_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImportBatch" ADD CONSTRAINT "ImportBatch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "public"."ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectLink" ADD CONSTRAINT "ProjectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_judgeUserId_fkey" FOREIGN KEY ("judgeUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Scorecard" ADD CONSTRAINT "Scorecard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Scorecard" ADD CONSTRAINT "Scorecard_judgeUserId_fkey" FOREIGN KEY ("judgeUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_generatedByUserId_fkey" FOREIGN KEY ("generatedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

