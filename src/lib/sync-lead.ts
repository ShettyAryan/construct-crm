import type { Priority } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Keep Lead.nextFollowUp in sync with FollowUp rows (earliest pending).
 * Call after any create / complete / schedule of follow-ups.
 */
export async function syncLeadNextFollowUp(leadId: string) {
  const next = await db.followUp.findFirst({
    where: { leadId, completed: false },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  await db.lead.update({
    where: { id: leadId },
    data: { nextFollowUp: next?.date ?? null },
  });
}

/**
 * When a lead form sets a next follow-up date, ensure a pending FollowUp exists
 * for that day, then refresh Lead.nextFollowUp from pending rows.
 */
export async function ensureFollowUpFromLeadDate(
  leadId: string,
  date: Date | null,
  priority: Priority = "Medium"
) {
  if (!date) {
    await syncLeadNextFollowUp(leadId);
    return;
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingSameDay = await db.followUp.findFirst({
    where: {
      leadId,
      completed: false,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  if (!existingSameDay) {
    await db.followUp.create({
      data: {
        leadId,
        date,
        priority,
        reminder: "Follow-up from lead",
      },
    });
  }

  await syncLeadNextFollowUp(leadId);
}

/**
 * Keep Lead.notes as the latest note preview, and create Note + Activity
 * when the lead form summary changes.
 */
export async function syncNotesFromLeadForm(
  leadId: string,
  notes: string | null,
  previousNotes: string | null,
  options?: { skipActivity?: boolean }
) {
  const trimmed = notes?.trim() || null;
  const prev = previousNotes?.trim() || null;

  if (trimmed === prev) return;

  if (trimmed) {
    await db.note.create({
      data: { leadId, body: trimmed },
    });

    if (!options?.skipActivity) {
      await db.activity.create({
        data: {
          leadId,
          type: "NOTE",
          title: prev ? "Notes updated" : "Note added",
          body: trimmed,
        },
      });
    }
  }
}
