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

function emptyToNull(v?: string | null) {
  return v && v.trim() ? v.trim() : null;
}

export async function logCall(raw: CallInput) {
  const data = callSchema.parse(raw);
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

  await db.activity.create({
    data: {
      leadId: data.leadId,
      type: "CALL",
      title: data.durationMin
        ? `Logged call (${data.durationMin} min)`
        : "Logged call",
      body: data.summary.trim(),
    },
  });

  revalidateCrm(data.leadId);
  return call;
}

export async function logMeeting(raw: MeetingInput) {
  const data = meetingSchema.parse(raw);
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

  await db.activity.create({
    data: {
      leadId: data.leadId,
      type: "MEETING",
      title: "Meeting logged",
      body: data.summary.trim(),
    },
  });

  revalidateCrm(data.leadId);
  return meeting;
}

export async function addNote(raw: NoteInput) {
  const data = noteSchema.parse(raw);
  const body = data.body.trim();

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

  await db.activity.create({
    data: {
      leadId: data.leadId,
      type: "NOTE",
      title: "Note added",
      body,
    },
  });

  revalidateCrm(data.leadId);
  return note;
}

export async function scheduleFollowUp(raw: FollowUpInput) {
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
    await db.activity.create({
      data: {
        leadId,
        type: "FOLLOW_UP",
        title: "Follow-up scheduled",
        body: emptyToNull(data.reminder) ?? `Follow-up on ${data.date}`,
      },
    });
  }

  revalidateCrm(leadId);
  return followUp;
}

export async function toggleFollowUp(id: string, completed: boolean) {
  const followUp = await db.followUp.update({
    where: { id },
    data: { completed },
  });

  if (followUp.leadId) {
    await syncLeadNextFollowUp(followUp.leadId);
  }

  revalidateCrm(followUp.leadId);
  return followUp;
}

export async function getCalls() {
  return db.call.findMany({
    include: { lead: true },
    orderBy: { date: "desc" },
  });
}

export async function getMeetings() {
  return db.meeting.findMany({
    include: { lead: true },
    orderBy: { date: "desc" },
  });
}

export async function getFollowUps(filter?: "pending" | "completed" | "all") {
  const where =
    filter === "pending"
      ? { completed: false }
      : filter === "completed"
        ? { completed: true }
        : {};
  return db.followUp.findMany({
    where,
    include: { lead: true },
    orderBy: [{ completed: "asc" }, { date: "asc" }],
  });
}
