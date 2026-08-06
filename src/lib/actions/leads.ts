"use server";

import { revalidatePath } from "next/cache";
import type { Agency, LeadStatus, Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { toJsonArray } from "@/lib/constants";
import { parseISTInput } from "@/lib/datetime";
import { leadSchema, type LeadInput } from "@/lib/validators";
import { ensureClientForWonLead } from "@/lib/actions/clients";

function emptyToNull(v?: string | null) {
  return v && v.trim() ? v.trim() : null;
}

function mapLeadData(input: LeadInput) {
  return {
    company: input.company.trim(),
    contact: input.contact.trim(),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    website: emptyToNull(input.website),
    linkedin: emptyToNull(input.linkedin),
    industry: emptyToNull(input.industry),
    city: emptyToNull(input.city),
    agency: input.agency as Agency,
    services: toJsonArray(input.services ?? []),
    budget: input.budget ?? null,
    source: emptyToNull(input.source),
    priority: input.priority as Priority,
    status: input.status as LeadStatus,
    notes: emptyToNull(input.notes),
    nextFollowUp: emptyToNull(input.nextFollowUp)
      ? parseISTInput(input.nextFollowUp!)
      : null,
  };
}

export async function getLeads(params?: {
  q?: string;
  agency?: string;
  status?: string;
  priority?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params?.agency) where.agency = params.agency;
  if (params?.status) where.status = params.status;
  if (params?.priority) where.priority = params.priority;
  if (params?.q) {
    where.OR = [
      { company: { contains: params.q } },
      { contact: { contains: params.q } },
      { email: { contains: params.q } },
      { city: { contains: params.q } },
    ];
  }

  return db.lead.findMany({
    where,
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getLead(id: string) {
  return db.lead.findUnique({
    where: { id },
    include: {
      calls: { orderBy: { date: "desc" } },
      meetings: { orderBy: { date: "desc" } },
      followUps: { orderBy: { date: "asc" } },
      notesList: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      client: true,
    },
  });
}

export async function createLead(raw: LeadInput) {
  const parsed = leadSchema.parse(raw);
  const lead = await db.lead.create({
    data: mapLeadData(parsed),
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "NOTE",
      title: "Lead created",
      body: `${lead.company} added to pipeline`,
    },
  });

  if (lead.status === "Won") {
    await ensureClientForWonLead(lead.id);
  }

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  return lead;
}

export async function updateLead(id: string, raw: LeadInput) {
  const parsed = leadSchema.parse(raw);
  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new Error("Lead not found");

  const data = mapLeadData(parsed);
  const lead = await db.lead.update({ where: { id }, data });

  if (existing.status !== lead.status) {
    await db.activity.create({
      data: {
        leadId: id,
        type: "STATUS_CHANGE",
        title: `Moved to ${lead.status}`,
        body: `Status updated from ${existing.status} to ${lead.status}`,
      },
    });
  }

  if (lead.status === "Won") {
    await ensureClientForWonLead(lead.id);
  }

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  return lead;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new Error("Lead not found");
  if (existing.status === status) return existing;

  const lead = await db.lead.update({
    where: { id },
    data: { status },
  });

  await db.activity.create({
    data: {
      leadId: id,
      type: "STATUS_CHANGE",
      title: status === "Won" ? "Deal won" : `Moved to ${status}`,
      body: `Status updated from ${existing.status} to ${status}`,
    },
  });

  if (status === "Won") {
    await ensureClientForWonLead(id);
  }

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  return lead;
}

export async function deleteLead(id: string) {
  await db.lead.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/clients");
}
