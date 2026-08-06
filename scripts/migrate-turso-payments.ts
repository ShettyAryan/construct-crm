/**
 * Apply only the client payment migration to Turso (safe if init already ran).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  }

  const client = createClient({ url, authToken });

  // Check current Client columns
  const tableInfo = await client.execute(`PRAGMA table_info("Client")`);
  const cols = new Set(tableInfo.rows.map((r) => String(r.name)));

  if (cols.has("amountAgreed") && cols.has("amountCollected")) {
    console.log("Turso Client table already has payment fields.");
    return;
  }

  if (!cols.has("revenue") && !cols.has("amountAgreed")) {
    throw new Error("Unexpected Client schema on Turso — inspect manually.");
  }

  console.log("Migrating Turso Client payment fields…");

  await client.execute("PRAGMA foreign_keys=OFF");

  await client.execute(`
    CREATE TABLE "new_Client" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "company" TEXT NOT NULL,
      "projects" TEXT NOT NULL DEFAULT '[]',
      "amountAgreed" INTEGER NOT NULL DEFAULT 0,
      "amountCollected" INTEGER NOT NULL DEFAULT 0,
      "services" TEXT NOT NULL DEFAULT '[]',
      "leadId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Client_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  if (cols.has("revenue")) {
    await client.execute(`
      INSERT INTO "new_Client" (
        "company", "createdAt", "id", "leadId", "projects", "services",
        "updatedAt", "amountAgreed", "amountCollected"
      )
      SELECT
        "company", "createdAt", "id", "leadId", "projects", "services",
        "updatedAt", COALESCE("revenue", 0), 0
      FROM "Client"
    `);
  } else {
    await client.execute(`
      INSERT INTO "new_Client" (
        "company", "createdAt", "id", "leadId", "projects", "services",
        "updatedAt", "amountAgreed", "amountCollected"
      )
      SELECT
        "company", "createdAt", "id", "leadId", "projects", "services",
        "updatedAt", 0, 0
      FROM "Client"
    `);
  }

  await client.execute(`DROP TABLE "Client"`);
  await client.execute(`ALTER TABLE "new_Client" RENAME TO "Client"`);
  await client.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Client_leadId_key" ON "Client"("leadId")`
  );
  await client.execute("PRAGMA foreign_keys=ON");

  console.log("Turso Client payment fields migrated.");
  void readFileSync; // keep import used if bundlers complain
  void join;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
