/**
 * Add ongoing-work project tables on Turso if they are missing.
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
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Project'`
  );

  if (tables.rows.length > 0) {
    console.log("Turso project tables already exist.");
    return;
  }

  console.log("Creating project tables on Turso…");
  const statements = [
    `CREATE TABLE "Project" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'NotStarted',
      "summary" TEXT,
      "clientId" TEXT NOT NULL,
      "managerId" TEXT,
      "deadline" DATETIME,
      "progress" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,
    `CREATE TABLE "ProjectUpdate" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "body" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "authorLogin" TEXT NOT NULL,
      "projectId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE INDEX "Project_clientId_idx" ON "Project"("clientId")`,
    `CREATE INDEX "Project_managerId_idx" ON "Project"("managerId")`,
    `CREATE INDEX "Project_deadline_idx" ON "Project"("deadline")`,
    `CREATE INDEX "ProjectUpdate_projectId_createdAt_idx" ON "ProjectUpdate"("projectId", "createdAt")`,
  ];

  for (const statement of statements) {
    await client.execute(statement);
  }

  console.log("Turso project schema is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
