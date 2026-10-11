/**
 * Add project deadline and progress columns on Turso if they are missing.
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
  const info = await client.execute(`PRAGMA table_info("Project")`);
  const cols = new Set(info.rows.map((row) => String(row.name)));

  if (!cols.has("deadline")) {
    await client.execute(`ALTER TABLE "Project" ADD COLUMN "deadline" DATETIME`);
  }
  if (!cols.has("progress")) {
    await client.execute(
      `ALTER TABLE "Project" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0`
    );
  }

  const indexes = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'Project_deadline_idx'`
  );
  if (indexes.rows.length === 0) {
    await client.execute(
      `CREATE INDEX "Project_deadline_idx" ON "Project"("deadline")`
    );
  }

  console.log("Turso project deadline columns are ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
