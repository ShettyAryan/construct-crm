"use server";

import type { Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { parseISTInput } from "@/lib/datetime";
import { revalidateCrm } from "@/lib/revalidate";
import { syncLeadNextFollowUp } from "@/lib/sync-lead";
import {
  callSchema,
  followUpSchema,
  meetingSchema,
  noteSchema,
  type CallInput,
  type FollowUpInput,
  type MeetingInput,
  type NoteInput,
} from "@/lib/validators";
import { requireEdit, requireView } from "@/lib/auth";
import { logLeadActivity, recordChange } from "@/lib/audit";

function emptyToNull(v?: string | null) {
  return v && v.trim() ? v.trim() : null;
}

export async function logCall(raw: CallInput) {
  await requireEdit("calls");
  const data = callSchema.parse(raw);
  const lead = await db.lead.findUnique({
    where: { id: data.leadId },
    select: { company: true },
  });
  const call = await db.call.create({
    data: {
      leadId: data.leadId,
      date: parseISTInput(data.date),
      durationMin: data.durationMin ?? null,
      outcome: emptyToNull(data.outcome),
      summary: data.summary.trim(),
      nextAction: emptyToNull(data.nextAction),
    },
  });

  await logLeadActivity({
    leadId: data.leadId,
    type: "CALL",
    title: data.durationMin
      ? `Logged call (${data.durationMin} min)`
      : "Logged call",
    body: data.summary.trim(),
  });

  await recordChange({
    action: "created",
    entityType: "Call",
    entityId: call.id,
    entityLabel: lead?.company ?? "Call",
    summary: `Logged a call on ${lead?.company ?? "a lead"}`,
  });

  revalidateCrm(data.leadId);
  return call;
}

export async function logMeeting(raw: MeetingInput) {
  await requireEdit("meetings");
  const data = meetingSchema.parse(raw);
  const lead = await db.lead.findUnique({
    where: { id: data.leadId },
    select: { company: true },
  });
  const meeting = await db.meeting.create({
    data: {
      leadId: data.leadId,
      date: parseISTInput(data.date),
      summary: data.summary.trim(),
      painPoints: emptyToNull(data.painPoints),
      requirements: emptyToNull(data.requirements),
      nextSteps: emptyToNull(data.nextSteps),
    },
  });

  await logLeadActivity({
    leadId: data.leadId,
    type: "MEETING",
    title: "Meeting logged",
    body: data.summary.trim(),
  });

  await recordChange({
    action: "created",
    entityType: "Meeting",
    entityId: meeting.id,
    entityLabel: lead?.company ?? "Meeting",
    summary: `Logged a meeting on ${lead?.company ?? "a lead"}`,
  });

  revalidateCrm(data.leadId);
  return meeting;
}

export async function addNote(raw: NoteInput) {
  await requireEdit("leads");
  const data = noteSchema.parse(raw);
  const body = data.body.trim();
  const lead = await db.lead.findUnique({
    where: { id: data.leadId },
    select: { company: true },
  });

  const note = await db.note.create({
    data: {
      leadId: data.leadId,
      body,
    },
  });

  // Keep Lead.notes as latest note so lead form / lists stay in sync
  await db.lead.update({
    where: { id: data.leadId },
    data: { notes: body },
  });

  await logLeadActivity({
    leadId: data.leadId,
    type: "NOTE",
    title: "Note added",
    body,
  });

  await recordChange({
    action: "created",
    entityType: "Note",
    entityId: note.id,
    entityLabel: lead?.company ?? "Note",
    summary: `Added a note on ${lead?.company ?? "a lead"}`,
  });

  revalidateCrm(data.leadId);
  return note;
}

export async function scheduleFollowUp(raw: FollowUpInput) {
  await requireEdit("followUps");
  const data = followUpSchema.parse(raw);
  const leadId = emptyToNull(data.leadId);

  const followUpDate = parseISTInput(
    data.time ? `${data.date}T${data.time}` : data.date
  );

  const followUp = await db.followUp.create({
    data: {
      leadId,
      date: followUpDate,
      time: emptyToNull(data.time),
      priority: data.priority as Priority,
      reminder: emptyToNull(data.reminder),
    },
  });

  if (leadId) {
    await syncLeadNextFollowUp(leadId);
    await logLeadActivity({
      leadId,
      type: "FOLLOW_UP",
      title: "Follow-up scheduled",
      body: emptyToNull(data.reminder) ?? `Follow-up on ${data.date}`,
    });
  }

  const lead = leadId
    ? await db.lead.findUnique({
        where: { id: leadId },
        select: { company: true },
      })
    : null;

  await recordChange({
    action: "created",
    entityType: "FollowUp",
    entityId: followUp.id,
    entityLabel: lead?.company ?? "Follow-up",
    summary: lead
      ? `Scheduled a follow-up for ${lead.company}`
      : "Scheduled a follow-up",
  });

  revalidateCrm(leadId);
  return followUp;
}

export async function completeFollowUp(id: string) {
  await requireEdit("followUps");
  const followUp = await db.followUp.findUnique({
    where: { id },
    include: { lead: { select: { company: true } } },
  });
  if (!followUp) throw new Error("Follow-up not found");

  await db.followUp.delete({ where: { id } });

  if (followUp.leadId) {
    await syncLeadNextFollowUp(followUp.leadId);
  }

  await recordChange({
    action: "deleted",
    entityType: "FollowUp",
    entityId: id,
    entityLabel: followUp.lead?.company ?? "Follow-up",
    summary: followUp.lead
      ? `Completed a follow-up for ${followUp.lead.company}`
      : "Completed a follow-up",
  });

  revalidateCrm(followUp.leadId);
  return followUp;
}

/** @deprecated Use completeFollowUp — completed follow-ups are removed */
export async function toggleFollowUp(id: string, completed: boolean) {
  if (completed) {
    return completeFollowUp(id);
  }
  return db.followUp.findUniqueOrThrow({ where: { id } });
}

export async function getCalls() {
  await requireView("calls");
  return db.call.findMany({
    include: { lead: true },
    orderBy: { date: "desc" },
  });
}

export async function getMeetings() {
  await requireView("meetings");
  return db.meeting.findMany({
    include: { lead: true },
    orderBy: { date: "desc" },
  });
}

export async function getFollowUps() {
  await requireView("followUps");
  return db.followUp.findMany({
    where: { completed: false },
    include: {
      lead: {
        include: {
          pocs: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            take: 1,
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });
}
