import { UserRole, type User } from "@prisma/client";
import { cookies } from "next/headers";

import { ensureBootstrapData } from "@/lib/server/bootstrap";
import {
  createSignedSessionValue,
  generateOpaqueToken,
  hashSecret,
  verifySignedSessionValue,
} from "@/lib/server/crypto";
import { prisma } from "@/lib/server/db";
import type { AppRole, SessionUser } from "@/lib/server/types";

const SESSION_COOKIE = "gg_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function roleToAppRole(role: UserRole): AppRole {
  return role === UserRole.ADMIN ? "admin" : "judge";
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function sessionUserFromRecord(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: roleToAppRole(user.role),
  };
}

async function createSession(userId: string) {
  const rawToken = generateOpaqueToken();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSecret(rawToken),
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, createSignedSessionValue(rawToken), getCookieOptions());
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureBootstrapData();

  const store = await cookies();
  const rawToken = verifySignedSessionValue(store.get(SESSION_COOKIE)?.value);

  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSecret(rawToken),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return sessionUserFromRecord(session.user);
}

export async function requireSessionUser(role?: AppRole) {
  const session = await getSessionUser();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (role && session.role !== role) {
    throw new Error("Forbidden");
  }

  return session;
}

export async function signOutCurrentSession() {
  const store = await cookies();
  const rawToken = verifySignedSessionValue(store.get(SESSION_COOKIE)?.value);

  if (rawToken) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSecret(rawToken),
      },
    });
  }

  store.delete(SESSION_COOKIE);
}

export async function signInAdmin(params: { name: string; email: string; authorizationCode: string }) {
  await ensureBootstrapData();

  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const authorizationCode = params.authorizationCode.trim();

  if (!name || !email || !authorizationCode) {
    throw new Error("Missing fields");
  }

  const code = await prisma.adminAccessCode.findUnique({
    where: {
      codeHash: hashSecret(authorizationCode),
    },
  });

  if (!code || code.status !== "ACTIVE") {
    throw new Error("Invalid authorization code");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: UserRole.ADMIN,
      status: "ACTIVE",
    },
    create: {
      email,
      name,
      role: UserRole.ADMIN,
    },
  });

  await createSession(user.id);
  return sessionUserFromRecord(user);
}

export async function redeemJudgeInvite(inviteCode: string) {
  await ensureBootstrapData();

  const normalizedCode = inviteCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("Missing invite code");
  }

  const invite = await prisma.inviteCode.findUnique({
    where: {
      codeHash: hashSecret(normalizedCode),
    },
    include: {
      event: true,
    },
  });

  if (!invite || invite.role !== UserRole.JUDGE || invite.status !== "SENT") {
    throw new Error("Invalid invite code");
  }

  const fallbackName = invite.email.split("@")[0].replace(/[._-]+/g, " ");
  const name = fallbackName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

  const user = await prisma.user.upsert({
    where: { email: invite.email.toLowerCase() },
    update: {
      name,
      role: UserRole.JUDGE,
      status: "ACTIVE",
    },
    create: {
      email: invite.email.toLowerCase(),
      name,
      role: UserRole.JUDGE,
    },
  });

  await prisma.$transaction([
    prisma.eventParticipant.upsert({
      where: {
        eventId_userId: {
          eventId: invite.eventId,
          userId: user.id,
        },
      },
      update: {
        role: UserRole.JUDGE,
        track: invite.track,
      },
      create: {
        eventId: invite.eventId,
        userId: user.id,
        role: UserRole.JUDGE,
        track: invite.track,
      },
    }),
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        status: "REDEEMED",
        redeemedAt: new Date(),
        redeemedByUserId: user.id,
      },
    }),
  ]);

  await createSession(user.id);
  return sessionUserFromRecord(user);
}
