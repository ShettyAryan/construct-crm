/*
  Warnings:

  - You are about to drop the column `revenue` on the `Client` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
);
INSERT INTO "new_Client" ("company", "createdAt", "id", "leadId", "projects", "services", "updatedAt", "amountAgreed", "amountCollected") SELECT "company", "createdAt", "id", "leadId", "projects", "services", "updatedAt", COALESCE("revenue", 0), 0 FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_leadId_key" ON "Client"("leadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
