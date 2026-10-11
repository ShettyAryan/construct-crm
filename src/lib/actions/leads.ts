"use server";

import type { Agency, LeadStatus, Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { toJsonArray } from "@/lib/constants";
import { parseISTInput } from "@/lib/datetime";
import { revalidateCrm } from "@/lib/revalidate";
import {
  ensureFollowUpFromLeadDate,
  syncNotesFromLeadForm,
} from "@/lib/sync-lead";
import { leadSchema, type LeadInput, type PocInput } from "@/lib/validators";
import { ensureClientForWonLead } from "@/lib/actions/clients";
import { requireAnyView, requireEdit } from "@/lib/auth";
import { logLeadActivity, recordChange } from "@/lib/audit";

function emptyToNull(v?: string | null) {
  return v && v.trim() ? v.trim() : null;
}

function normalizePocs(pocs: PocInput[]) {
  const cleaned = pocs
    .map((p) => ({
      name: p.name.trim(),
      email: emptyToNull(p.email),
      phone: emptyToNull(p.phone),
      role: emptyToNull(p.role),
      linkedin: emptyToNull(p.linkedin),
      isPrimary: Boolean(p.isPrimary),
    }))
    .filter((p) => p.name);

  if (cleaned.length === 0) {
    throw new Error("Add at least one POC");
  }

  if (!cleaned.some((p) => p.isPrimary)) {
    cleaned[0].isPrimary = true;
  } else {
    let seenPrimary = false;
    for (const p of cleaned) {
      if (p.isPrimary) {
        if (seenPrimary) p.isPrimary = false;
        else seenPrimary = true;
      }
    }
  }

  return cleaned;
}

function mapLeadData(input: LeadInput) {
  return {
    company: input.company.trim(),
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
  openOnly?: boolean;
}) {
  await requireAnyView(["leads", "pipeline", "tracks"]);
  const where: Record<string, unknown> = {};
  if (params?.agency) where.agency = params.agency;
  if (params?.status) where.status = params.status;
  if (params?.priority) where.priority = params.priority;
  if (params?.openOnly) where.status = { notIn: ["Won", "Lost"] };
  if (params?.q) {
    where.OR = [
      { company: { contains: params.q } },
      { city: { contains: params.q } },
      {
        pocs: {
          some: {
            OR: [
              { name: { contains: params.q } },
              { email: { contains: params.q } },
              { phone: { contains: params.q } },
            ],
          },
        },
      },
    ];
  }

  return db.lead.findMany({
    where,
    include: { pocs: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getLead(id: string) {
  await requireAnyView(["leads", "pipeline", "tracks", "clients"]);
  return db.lead.findUnique({
    where: { id },
    include: {
      pocs: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      calls: { orderBy: { date: "desc" } },
      meetings: { orderBy: { date: "desc" } },
      followUps: { where: { completed: false }, orderBy: { date: "asc" } },
      notesList: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      client: true,
    },
  });
}

export async function getLeadOptions() {
  await requireAnyView(["leads", "followUps", "calls", "meetings"]);
  return db.lead.findMany({
    where: { status: { notIn: ["Lost"] } },
    select: {
      id: true,
      company: true,
      pocs: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1,
        select: { name: true },
      },
    },
    orderBy: { company: "asc" },
  });
}

export async function createLead(raw: LeadInput) {
  await requireEdit("leads");
  const parsed = leadSchema.parse(raw);
  const data = mapLeadData(parsed);
  const pocs = normalizePocs(parsed.pocs);

  const lead = await db.lead.create({
    data: {
      ...data,
      pocs: { create: pocs },
    },
  });

  await logLeadActivity({
    leadId: lead.id,
    type: "NOTE",
    title: "Lead created",
    body: `${lead.company} added to pipeline`,
  });

  if (data.notes) {
    await syncNotesFromLeadForm(lead.id, data.notes, null, {
      skipActivity: true,
    });
  }

  await ensureFollowUpFromLeadDate(
    lead.id,
    data.nextFollowUp,
    data.priority
  );

  if (lead.status === "Won") {
    await ensureClientForWonLead(lead.id);
  }

  await recordChange({
    action: "created",
    entityType: "Lead",
    entityId: lead.id,
    entityLabel: lead.company,
    summary: `Created lead ${lead.company}`,
  });

  revalidateCrm(lead.id);
  return lead;
}

export async function updateLead(id: string, raw: LeadInput) {
  await requireEdit("leads");
  const parsed = leadSchema.parse(raw);
  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new Error("Lead not found");

  const data = mapLeadData(parsed);
  const pocs = normalizePocs(parsed.pocs);

  const lead = await db.$transaction(async (tx) => {
    await tx.poc.deleteMany({ where: { leadId: id } });
    return tx.lead.update({
      where: { id },
      data: {
        ...data,
        pocs: { create: pocs },
      },
    });
  });

  if (existing.status !== lead.status) {
    await logLeadActivity({
      leadId: id,
      type: "STATUS_CHANGE",
      title: `Moved to ${lead.status}`,
      body: `Status updated from ${existing.status} to ${lead.status}`,
    });
  }

  await syncNotesFromLeadForm(id, data.notes, existing.notes);

  await ensureFollowUpFromLeadDate(id, data.nextFollowUp, data.priority);

  if (lead.status === "Won") {
    await ensureClientForWonLead(lead.id);
  }

  const changes: string[] = [];
  if (existing.company !== lead.company) changes.push("company");
  if (existing.status !== lead.status) {
    changes.push(`status ${existing.status} → ${lead.status}`);
  }
  if (existing.priority !== lead.priority) {
    changes.push(`priority ${existing.priority} → ${lead.priority}`);
  }
  await recordChange({
    action: "updated",
    entityType: "Lead",
    entityId: lead.id,
    entityLabel: lead.company,
    summary: changes.length
      ? `Updated ${lead.company}: ${changes.join(", ")}`
      : `Updated ${lead.company}`,
  });

  revalidateCrm(id);
  return lead;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await requireEdit("pipeline");
  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new Error("Lead not found");
  if (existing.status === status) return existing;

  const lead = await db.lead.update({
    where: { id },
    data: { status },
  });

  await logLeadActivity({
    leadId: id,
    type: "STATUS_CHANGE",
    title: status === "Won" ? "Deal won" : `Moved to ${status}`,
    body: `Status updated from ${existing.status} to ${status}`,
  });

  if (status === "Won") {
    await ensureClientForWonLead(id);
  }

  await recordChange({
    action: "updated",
    entityType: "Lead",
    entityId: id,
    entityLabel: existing.company,
    summary: `Moved ${existing.company} from ${existing.status} to ${status}`,
  });

  revalidateCrm(id);
  return lead;
}

export async function deleteLead(id: string) {
  await requireEdit("leads");
  const existing = await db.lead.findUnique({
    where: { id },
    select: { company: true },
  });
  if (!existing) throw new Error("Lead not found");
  await db.lead.delete({ where: { id } });
  await recordChange({
    action: "deleted",
    entityType: "Lead",
    entityId: id,
    entityLabel: existing.company,
    summary: `Deleted lead ${existing.company}`,
  });
  revalidateCrm(id);
}
