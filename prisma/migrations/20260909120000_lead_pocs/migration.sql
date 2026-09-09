-- CreateTable
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
);

-- Migrate existing contact fields into primary POCs
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
WHERE "contact" IS NOT NULL AND trim("contact") != '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
);
INSERT INTO "new_Lead" ("agency", "budget", "city", "company", "createdAt", "id", "industry", "linkedin", "nextFollowUp", "notes", "priority", "services", "source", "status", "updatedAt", "website")
SELECT "agency", "budget", "city", "company", "createdAt", "id", "industry", "linkedin", "nextFollowUp", "notes", "priority", "services", "source", "status", "updatedAt", "website" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
