"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseJsonArray, toJsonArray } from "@/lib/constants";
import {
  clientPaymentSchema,
  type ClientPaymentInput,
} from "@/lib/validators";

export async function ensureClientForWonLead(leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.status !== "Won") return null;

  const services = parseJsonArray(lead.services);
  const agreed = lead.budget ?? 0;

  return db.client.upsert({
    where: { leadId },
    create: {
      leadId,
      company: lead.company,
      amountAgreed: agreed,
      amountCollected: 0,
      services: toJsonArray(services),
      projects: toJsonArray([`${lead.company} Engagement`]),
    },
    update: {
      company: lead.company,
      services: toJsonArray(services),
      // Keep existing payment figures — edit them on Clients page
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

  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath(`/leads/${client.leadId}`);
  return client;
}
