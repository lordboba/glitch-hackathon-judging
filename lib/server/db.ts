import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/server/env";

declare global {
  // eslint-disable-next-line no-var
  var __glitchGradersPrisma: PrismaClient | undefined;
}

process.env.DATABASE_URL ??= env.databaseUrl;

export const prisma =
  global.__glitchGradersPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__glitchGradersPrisma = prisma;
}
