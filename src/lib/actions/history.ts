"use server";

import { db } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export type HistoryEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  summary: string;
  actorName: string;
  actorLogin: string;
  createdAt: string;
};

export async function getHistory(): Promise<HistoryEntry[]> {
  await requireProfile();
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 400,
  });
  return logs.map(toEntry);
}

export async function getRecordHistory(
  entityType: string,
  entityId: string
): Promise<HistoryEntry[]> {
  await requireProfile();
  const logs = await db.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return logs.map(toEntry);
}

function toEntry(log: {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  summary: string;
  actorName: string;
  actorLogin: string;
  createdAt: Date;
}): HistoryEntry {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    entityLabel: log.entityLabel,
    summary: log.summary,
    actorName: log.actorName,
    actorLogin: log.actorLogin,
    createdAt: log.createdAt.toISOString(),
  };
}
