"use server";

import { startOfDay, endOfDay, addDays } from "date-fns";
import { db } from "@/lib/db";

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const [
    totalLeads,
    hotLeads,
    dealsWon,
    pipelineLeads,
    followUpsDueToday,
    upcomingCalls,
    recentActivity,
    pendingTasks,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { priority: "Hot", status: { notIn: ["Won", "Lost"] } } }),
    db.lead.count({ where: { status: "Won" } }),
    db.lead.findMany({
      where: { status: { notIn: ["Won", "Lost"] } },
      select: { budget: true },
    }),
    db.followUp.findMany({
      where: {
        completed: false,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { lead: true },
      orderBy: { date: "asc" },
    }),
    db.call.findMany({
      where: {
        date: { gte: todayStart, lte: weekEnd },
      },
      include: { lead: true },
      orderBy: { date: "asc" },
      take: 8,
    }),
    db.activity.findMany({
      include: { lead: true },
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

  // Upcoming calls: also surface leads with nextFollowUp as "calls to make"
  const upcomingFollowCallLeads = await db.lead.findMany({
    where: {
      nextFollowUp: { gte: todayStart, lte: weekEnd },
      status: { notIn: ["Won", "Lost"] },
    },
    orderBy: { nextFollowUp: "asc" },
    take: 8,
  });

  return {
    totalLeads,
    hotLeads,
    dealsWon,
    revenuePipeline,
    followUpsDueToday,
    upcomingCalls,
    upcomingFollowCallLeads,
    recentActivity,
    pendingTasks,
  };
}
