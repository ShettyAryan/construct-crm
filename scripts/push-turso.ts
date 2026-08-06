/**
 * Apply the latest Prisma migration SQL to your Turso (hosted SQLite) database.
 *
 * Prerequisites:
 *   1. Create a DB: https://turso.tech (free tier is fine)
 *   2. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env
 *   3. Run: npm run db:push:turso
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env before running db:push:turso",
    );
  }

  if (url.startsWith("file:")) {
    throw new Error(
      "TURSO_DATABASE_URL must be a libsql:// or https:// Turso URL",
    );
  }

  const migrationsDir = join(process.cwd(), "prisma", "migrations");

  const folders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (folders.length === 0) {
    throw new Error("No migrations found in prisma/migrations");
  }

  const client = createClient({
    url,
    authToken,
  });

  for (const folder of folders) {
    const sqlPath = join(migrationsDir, folder, "migration.sql");
    const sql = readFileSync(sqlPath, "utf8");

    console.log(`Applying ${folder}...`);

    // Remove Prisma comment lines before splitting
    const cleanedSql = sql.replace(/^--.*$/gm, "");

    const statements = cleanedSql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await client.execute(statement);
      } catch (error) {
        console.error("\nFailed SQL statement:\n");
        console.error(statement);
        console.error("\n");
        throw error;
      }
    }
  }

  console.log("✅ Turso schema is up to date.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
