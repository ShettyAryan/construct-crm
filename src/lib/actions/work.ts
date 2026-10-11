"use server";

import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentProfile, requireEdit, requireView } from "@/lib/auth";
import { recordChange } from "@/lib/audit";
import {
  PROJECT_STATUS_LABELS,
  isProjectStatus,
} from "@/lib/project-status";
import { linkOngoingClientProjects } from "@/lib/work-sync";
import { formatISTDate, parseISTInput } from "@/lib/datetime";

function refreshWork(projectId?: string) {
  revalidatePath("/work");
  revalidatePath("/start");
  if (projectId) revalidatePath(`/work/${projectId}`);
}

async function writeUpdate(projectId: string, body: string) {
  const profile = await getCurrentProfile();
  return db.projectUpdate.create({
    data: {
      projectId,
      body,
      authorName: profile?.name ?? "Unknown",
      authorLogin: profile?.loginId ?? "unknown",
    },
  });
}

export async function listWorkProjects(clientId?: string) {
  await requireView("work");
  await linkOngoingClientProjects();
  return db.project.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      client: { select: { id: true, company: true, leadId: true } },
      manager: { select: { id: true, name: true, loginId: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getWorkProject(id: string) {
  await requireView("work");
  return db.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, company: true, leadId: true } },
      manager: { select: { id: true, name: true, loginId: true } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listWorkClients() {
  await requireView("work");
  return db.client.findMany({
    select: { id: true, company: true, leadId: true },
    orderBy: { company: "asc" },
  });
}

export async function listManagers() {
  await requireView("work");
  return db.profile.findMany({
    where: { active: true },
    select: { id: true, name: true, loginId: true },
    orderBy: { name: "asc" },
  });
}

export async function createProject(input: {
  name: string;
  clientId: string;
  managerId?: string | null;
  status?: string;
  summary?: string | null;
  deadline?: string | null;
  progress?: number | null;
}) {
  await requireEdit("work");
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");

  const client = await db.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new Error("Choose a client from the client track");

  const status = input.status && isProjectStatus(input.status) ? input.status : "NotStarted";
  const managerId = input.managerId || null;
  if (managerId) {
    const manager = await db.profile.findFirst({
      where: { id: managerId, active: true },
    });
    if (!manager) throw new Error("Choose an active profile as the manager");
  }

  const progress = clampProgress(input.progress ?? (status === "Completed" ? 100 : 0));
  const project = await db.project.create({
    data: {
      name,
      clientId: client.id,
      managerId,
      status: status as ProjectStatus,
      summary: input.summary?.trim() || null,
      deadline: input.deadline ? parseISTInput(input.deadline) : null,
      progress,
    },
    include: { manager: true },
  });

  await writeUpdate(
    project.id,
    `Project opened for ${client.company}${
      project.manager ? ` · managed by ${project.manager.name}` : ""
    }`
  );

  await recordChange({
    action: "created",
    entityType: "Project",
    entityId: project.id,
    entityLabel: project.name,
    summary: `Opened project ${project.name} for ${client.company}`,
  });
  refreshWork(project.id);
  return { id: project.id };
}

export async function updateProjectStatus(id: string, status: string) {
  await requireEdit("work");
  if (!isProjectStatus(status)) throw new Error("Unknown project status");
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) throw new Error("Project not found");
  if (existing.status === status) return;

  await db.project.update({
    where: { id },
    data: {
      status: status as ProjectStatus,
      ...(status === "Completed" ? { progress: 100 } : {}),
    },
  });
  await writeUpdate(
    id,
    `Status changed to ${PROJECT_STATUS_LABELS[status]}`
  );
  await recordChange({
    action: "updated",
    entityType: "Project",
    entityId: id,
    entityLabel: existing.name,
    summary: `Set ${existing.name} to ${PROJECT_STATUS_LABELS[status]}`,
  });
  refreshWork(id);
}

export async function updateProjectManager(id: string, managerId: string) {
  await requireEdit("work");
  const existing = await db.project.findUnique({
    where: { id },
    include: { manager: true },
  });
  if (!existing) throw new Error("Project not found");

  const nextId = managerId || null;
  if (existing.managerId === nextId) return;

  let managerName = "Unassigned";
  if (nextId) {
    const manager = await db.profile.findFirst({
      where: { id: nextId, active: true },
    });
    if (!manager) throw new Error("Choose an active profile as the manager");
    managerName = manager.name;
  }

  await db.project.update({
    where: { id },
    data: { managerId: nextId },
  });
  await writeUpdate(id, `Manager set to ${managerName}`);
  await recordChange({
    action: "updated",
    entityType: "Project",
    entityId: id,
    entityLabel: existing.name,
    summary: `Set manager of ${existing.name} to ${managerName}`,
  });
  refreshWork(id);
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function updateProjectDeadline(id: string, date: string | null) {
  await requireEdit("work");
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) throw new Error("Project not found");

  const deadline = date ? parseISTInput(date) : null;
  const previous = existing.deadline?.getTime() ?? null;
  const next = deadline?.getTime() ?? null;
  if (previous === next) return;

  await db.project.update({
    where: { id },
    data: { deadline },
  });
  const label = deadline ? formatISTDate(deadline) : "none";
  await writeUpdate(
    id,
    deadline ? `Deadline set to ${label}` : "Deadline cleared"
  );
  await recordChange({
    action: "updated",
    entityType: "Project",
    entityId: id,
    entityLabel: existing.name,
    summary: deadline
      ? `Set deadline of ${existing.name} to ${label}`
      : `Cleared deadline of ${existing.name}`,
  });
  refreshWork(id);
}

export async function updateProjectProgress(id: string, value: number) {
  await requireEdit("work");
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) throw new Error("Project not found");
  const progress = clampProgress(value);
  if (existing.progress === progress) return;

  await db.project.update({
    where: { id },
    data: { progress },
  });
  await writeUpdate(id, `Progress set to ${progress}%`);
  await recordChange({
    action: "updated",
    entityType: "Project",
    entityId: id,
    entityLabel: existing.name,
    summary: `Set progress of ${existing.name} to ${progress}%`,
  });
  refreshWork(id);
}

export async function addProjectUpdate(id: string, body: string) {
  await requireEdit("work");
  const text = body.trim();
  if (!text) throw new Error("Write an update before saving");
  const project = await db.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found");

  await writeUpdate(id, text);
  await db.project.update({ where: { id }, data: { updatedAt: new Date() } });
  await recordChange({
    action: "created",
    entityType: "ProjectUpdate",
    entityId: id,
    entityLabel: project.name,
    summary: `Update on ${project.name}`,
  });
  refreshWork(id);
}
