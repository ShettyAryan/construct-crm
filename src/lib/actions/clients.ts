"use server";

import type { WorkStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray, toJsonArray } from "@/lib/constants";
import { revalidateCrm } from "@/lib/revalidate";
import {
  clientPaymentSchema,
  type ClientPaymentInput,
} from "@/lib/validators";
import { canEdit } from "@/lib/access";
import { getCurrentProfile, requireEdit, requireView } from "@/lib/auth";
import { recordChange } from "@/lib/audit";

export async function ensureClientForWonLead(leadId: string) {
  const profile = await getCurrentProfile();
  if (
    !profile ||
    (!canEdit(profile, "leads") && !canEdit(profile, "pipeline"))
  ) {
    throw new Error("You don't have permission to change this");
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.status !== "Won") return null;

  const services = parseJsonArray(lead.services);
  const agreed = lead.budget ?? 0;
  const existing = await db.client.findUnique({ where: { leadId } });

  const client = await db.client.upsert({
    where: { leadId },
    create: {
      leadId,
      company: lead.company,
      amountAgreed: agreed,
      amountCollected: 0,
      workStatus: "Ongoing",
      services: toJsonArray(services),
      projects: toJsonArray([`${lead.company} Engagement`]),
    },
    update: {
      company: lead.company,
      services: toJsonArray(services),
      // Sync budget → agreed only before any payment is recorded
      ...(existing && existing.amountCollected === 0 && agreed > 0
        ? { amountAgreed: agreed }
        : {}),
    },
  });

  if (!existing) {
    await recordChange({
      action: "created",
      entityType: "Client",
      entityId: client.id,
      entityLabel: lead.company,
      summary: `Opened client record for ${lead.company}`,
    });
  }

  return client;
}

export async function getClients() {
  await requireView("clients");
  return db.client.findMany({
    include: {
      lead: {
        include: {
          pocs: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateClientPayment(
  clientId: string,
  raw: ClientPaymentInput
) {
  await requireEdit("clients");
  const data = clientPaymentSchema.parse(raw);

  const client = await db.client.update({
    where: { id: clientId },
    data: {
      amountAgreed: data.amountAgreed,
      amountCollected: data.amountCollected,
    },
  });

  await recordChange({
    action: "updated",
    entityType: "Client",
    entityId: client.id,
    entityLabel: client.company,
    summary: `Updated payment for ${client.company}`,
  });

  revalidateCrm(client.leadId);
  return client;
}

export async function updateClientWorkStatus(
  clientId: string,
  workStatus: WorkStatus
) {
  await requireEdit("clients");
  const client = await db.client.update({
    where: { id: clientId },
    data: { workStatus },
  });

  await recordChange({
    action: "updated",
    entityType: "Client",
    entityId: client.id,
    entityLabel: client.company,
    summary: `Set ${client.company} work to ${workStatus}`,
  });

  revalidateCrm(client.leadId);
  return client;
}

const leadWithPocs = {
  pocs: {
    orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
  },
};

export async function getTracksData() {
  await requireView("tracks");
  const [activeLeads, ongoingClients, completedClients] = await Promise.all([
    db.lead.findMany({
      where: { status: { notIn: ["Won", "Lost"] } },
      include: leadWithPocs,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    }),
    db.client.findMany({
      where: { workStatus: "Ongoing" },
      include: { lead: { include: leadWithPocs } },
      orderBy: { updatedAt: "desc" },
    }),
    db.client.findMany({
      where: { workStatus: "Completed" },
      include: { lead: { include: leadWithPocs } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { activeLeads, ongoingClients, completedClients };
}
