import { revalidatePath } from "next/cache";
import type { ActivityType } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

export async function recordChange(input: {
  action: "created" | "updated" | "deleted";
  entityType: string;
  entityId?: string | null;
  entityLabel: string;
  summary: string;
}) {
  const profile = await getCurrentProfile();
  await db.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel,
      summary: input.summary,
      profileId: profile?.id ?? null,
      actorName: profile?.name ?? "Unknown",
      actorLogin: profile?.loginId ?? "unknown",
    },
  });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logLeadActivity(input: {
  leadId: string;
  type: ActivityType;
  title: string;
  body?: string | null;
}) {
  const profile = await getCurrentProfile();
  return db.activity.create({
    data: {
      leadId: input.leadId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      actorName: profile?.name ?? null,
      actorLogin: profile?.loginId ?? null,
    },
  });
}
