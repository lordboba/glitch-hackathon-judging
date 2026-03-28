import { createHash, createHmac, randomBytes } from "node:crypto";

import { env } from "@/lib/server/env";

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function signToken(token: string) {
  return createHmac("sha256", env.sessionSecret).update(token).digest("base64url");
}

export function createSignedSessionValue(token: string) {
  return `${token}.${signToken(token)}`;
}

export function verifySignedSessionValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [token, signature] = value.split(".");

  if (!token || !signature) {
    return null;
  }

  return signToken(token) === signature ? token : null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
