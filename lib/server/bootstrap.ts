import { AdminAccessCodeStatus } from "@prisma/client";

import { hashSecret } from "@/lib/server/crypto";
import { prisma } from "@/lib/server/db";
import { env } from "@/lib/server/env";

let bootstrapPromise: Promise<void> | null = null;

async function bootstrap() {
  const adminCodeHash = hashSecret(env.adminAuthCode.trim());

  const existingAccessCode = await prisma.adminAccessCode.findUnique({
    where: { codeHash: adminCodeHash },
  });

  if (existingAccessCode) {
    return;
  }

  await prisma.adminAccessCode.create({
    data: {
      codeHash: adminCodeHash,
      label: "Primary organizer access",
      status: AdminAccessCodeStatus.ACTIVE,
    },
  });
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
