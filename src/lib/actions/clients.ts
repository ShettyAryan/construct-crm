"use server";

import type { WorkStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray, toJsonArray } from "@/lib/constants";
import { revalidateCrm } from "@/lib/revalidate";
import {
  clientPaymentSchema,
  type ClientPaymentInput,
} from "@/lib/validators";

export async function ensureClientForWonLead(leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.status !== "Won") return null;

  const services = parseJsonArray(lead.services);
  const agreed = lead.budget ?? 0;
  const existing = await db.client.findUnique({ where: { leadId } });

  return db.client.upsert({
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
}

export async function getClients() {
  return db.client.findMany({
    include: { lead: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateClientPayment(
  clientId: string,
  raw: ClientPaymentInput
) {
  const data = clientPaymentSchema.parse(raw);

  const client = await db.client.update({
    where: { id: clientId },
    data: {
      amountAgreed: data.amountAgreed,
      amountCollected: data.amountCollected,
    },
  });

  revalidateCrm(client.leadId);
  return client;
}

export async function updateClientWorkStatus(
  clientId: string,
  workStatus: WorkStatus
) {
  const client = await db.client.update({
    where: { id: clientId },
    data: { workStatus },
  });

  revalidateCrm(client.leadId);
  return client;
}

export async function getTracksData() {
  const [activeLeads, ongoingClients, completedClients] = await Promise.all([
    db.lead.findMany({
      where: { status: { notIn: ["Won", "Lost"] } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    }),
    db.client.findMany({
      where: { workStatus: "Ongoing" },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.client.findMany({
      where: { workStatus: "Completed" },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { activeLeads, ongoingClients, completedClients };
}
