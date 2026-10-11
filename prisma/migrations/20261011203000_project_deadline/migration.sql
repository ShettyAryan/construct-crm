-- AlterTable
ALTER TABLE "Project" ADD COLUMN "deadline" DATETIME;
ALTER TABLE "Project" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Project_deadline_idx" ON "Project"("deadline");
