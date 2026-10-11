/**
 * Add profile, session, and audit tables on Turso if they are missing.
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  }

  const client = createClient({ url, authToken });
  const tables = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Profile'`
  );

  if (tables.rows.length > 0) {
    console.log("Turso profile tables already exist.");
  } else {
    console.log("Creating profile, session, and audit tables on Turso…");
    const statements = [
      `CREATE TABLE "Profile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "loginId" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "isAdmin" BOOLEAN NOT NULL DEFAULT false,
        "access" TEXT NOT NULL DEFAULT '{}',
        "lastLoginAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE UNIQUE INDEX "Profile_loginId_key" ON "Profile"("loginId")`,
      `CREATE TABLE "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "token" TEXT NOT NULL,
        "profileId" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token")`,
      `CREATE INDEX "Session_profileId_idx" ON "Session"("profileId")`,
      `CREATE TABLE "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "action" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT,
        "entityLabel" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "profileId" TEXT,
        "actorName" TEXT NOT NULL,
        "actorLogin" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      )`,
      `CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`,
      `CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId")`,
    ];
    for (const statement of statements) {
      await client.execute(statement);
    }
  }

  const activity = await client.execute(`PRAGMA table_info("Activity")`);
  const cols = new Set(activity.rows.map((row) => String(row.name)));
  if (!cols.has("actorName")) {
    await client.execute(`ALTER TABLE "Activity" ADD COLUMN "actorName" TEXT`);
  }
  if (!cols.has("actorLogin")) {
    await client.execute(`ALTER TABLE "Activity" ADD COLUMN "actorLogin" TEXT`);
  }

  console.log("Turso profile schema is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
