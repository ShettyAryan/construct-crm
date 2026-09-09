"use server";

import { db } from "@/lib/db";
import { getISTDayBounds } from "@/lib/datetime";

export async function getDashboardData() {
  const { start: todayStart, end: todayEnd, endAhead: weekEnd } =
    getISTDayBounds(7);

  const [
    totalLeads,
    hotLeads,
    dealsWon,
    pipelineLeads,
    clients,
    followUpsDueToday,
    upcomingFollowUps,
    recentActivity,
    pendingTasks,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({
      where: { priority: "Hot", status: { notIn: ["Won", "Lost"] } },
    }),
    db.lead.count({ where: { status: "Won" } }),
    db.lead.findMany({
      where: { status: { notIn: ["Won", "Lost"] } },
      select: { budget: true },
    }),
    db.client.findMany({
      select: { amountAgreed: true, amountCollected: true },
    }),
    db.followUp.findMany({
      where: {
        completed: false,
        date: { gte: todayStart, lte: todayEnd },
      },
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
    }),
    db.followUp.findMany({
      where: {
        completed: false,
        date: { gte: todayStart, lte: weekEnd },
      },
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
      take: 10,
    }),
    db.activity.findMany({
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
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.task.findMany({
      where: { completed: false },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const revenuePipeline = pipelineLeads.reduce(
    (sum, l) => sum + (l.budget ?? 0),
    0
  );

  const amountAgreed = clients.reduce((sum, c) => sum + c.amountAgreed, 0);
  const amountCollected = clients.reduce(
    (sum, c) => sum + c.amountCollected,
    0
  );
  const amountOutstanding = Math.max(0, amountAgreed - amountCollected);

  return {
    totalLeads,
    hotLeads,
    dealsWon,
    revenuePipeline,
    amountAgreed,
    amountCollected,
    amountOutstanding,
    followUpsDueToday,
    upcomingFollowUps,
    recentActivity,
    pendingTasks,
  };
}
