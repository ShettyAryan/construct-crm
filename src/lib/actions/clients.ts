"use server";

import { db } from "@/lib/db";
import { parseJsonArray, toJsonArray } from "@/lib/constants";

export async function ensureClientForWonLead(leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.status !== "Won") return null;

  const services = parseJsonArray(lead.services);

  return db.client.upsert({
    where: { leadId },
    create: {
      leadId,
      company: lead.company,
      revenue: lead.budget ?? 0,
      services: toJsonArray(services),
      projects: toJsonArray([`${lead.company} Engagement`]),
    },
    update: {
      company: lead.company,
      revenue: lead.budget ?? 0,
      services: toJsonArray(services),
    },
  });
}

export async function getClients() {
  return db.client.findMany({
    include: { lead: true },
    orderBy: { updatedAt: "desc" },
  });
}
