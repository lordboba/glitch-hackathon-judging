function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (!process.env[name]) {
    process.env[name] = value;
  }

  return value;
}

export const env = {
  databaseUrl: readEnv(
    "DATABASE_URL",
    "postgresql://glitch:glitch@localhost:5432/glitch_graders?schema=public",
  ),
  sessionSecret: readEnv("SESSION_SECRET", "local-dev-session-secret"),
  appUrl: readEnv("APP_URL", "http://localhost:3000"),
  adminAuthCode: readEnv("ADMIN_AUTH_CODE", "ORBIT-ADMIN-2026"),
};
