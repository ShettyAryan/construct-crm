/**
 * Add Poc table and move Lead contact fields onto Turso if missing.
 *
 * Run: npx tsx scripts/migrate-turso-pocs.ts
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
    `SELECT name FROM sqlite_master WHERE type='table' AND name='Poc'`
  );
  if (tables.rows.length > 0) {
    console.log("Turso Poc table already exists.");
    return;
  }

  const leadInfo = await client.execute(`PRAGMA table_info("Lead")`);
  const leadCols = new Set(leadInfo.rows.map((r) => String(r.name)));
  const hasLegacyContact = leadCols.has("contact");

  console.log("Creating Poc table on Turso…");
  await client.execute(`
    CREATE TABLE "Poc" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "role" TEXT,
      "linkedin" TEXT,
      "isPrimary" BOOLEAN NOT NULL DEFAULT false,
      "leadId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Poc_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  if (hasLegacyContact) {
    console.log("Migrating Lead contact fields into Poc…");
    await client.execute(`
      INSERT INTO "Poc" ("id", "name", "email", "phone", "role", "linkedin", "isPrimary", "leadId", "createdAt", "updatedAt")
      SELECT
        lower(hex(randomblob(16))),
        "contact",
        "email",
        "phone",
        NULL,
        NULL,
        1,
        "id",
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "Lead"
      WHERE "contact" IS NOT NULL AND trim("contact") != ''
    `);

    console.log("Recreating Lead without contact/phone/email…");
    await client.execute(`PRAGMA foreign_keys=OFF`);
    await client.execute(`
      CREATE TABLE "new_Lead" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "company" TEXT NOT NULL,
        "website" TEXT,
        "linkedin" TEXT,
        "industry" TEXT,
        "city" TEXT,
        "agency" TEXT NOT NULL,
        "services" TEXT NOT NULL DEFAULT '[]',
        "budget" INTEGER,
        "source" TEXT,
        "priority" TEXT NOT NULL DEFAULT 'Medium',
        "status" TEXT NOT NULL DEFAULT 'New',
        "notes" TEXT,
        "nextFollowUp" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await client.execute(`
      INSERT INTO "new_Lead" (
        "agency", "budget", "city", "company", "createdAt", "id", "industry",
        "linkedin", "nextFollowUp", "notes", "priority", "services", "source",
        "status", "updatedAt", "website"
      )
      SELECT
        "agency", "budget", "city", "company", "createdAt", "id", "industry",
        "linkedin", "nextFollowUp", "notes", "priority", "services", "source",
        "status", "updatedAt", "website"
      FROM "Lead"
    `);
    await client.execute(`DROP TABLE "Lead"`);
    await client.execute(`ALTER TABLE "new_Lead" RENAME TO "Lead"`);
    await client.execute(`PRAGMA foreign_keys=ON`);
  }

  console.log("Turso Poc migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
