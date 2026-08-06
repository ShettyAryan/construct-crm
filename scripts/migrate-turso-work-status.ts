/**
 * Add Client.workStatus to Turso if missing.
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
  const tableInfo = await client.execute(`PRAGMA table_info("Client")`);
  const cols = new Set(tableInfo.rows.map((r) => String(r.name)));

  if (cols.has("workStatus")) {
    console.log("Turso Client.workStatus already exists.");
    return;
  }

  console.log("Adding Client.workStatus on Turso…");
  await client.execute(
    `ALTER TABLE "Client" ADD COLUMN "workStatus" TEXT NOT NULL DEFAULT 'Ongoing'`
  );
  console.log("Turso Client.workStatus added.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
