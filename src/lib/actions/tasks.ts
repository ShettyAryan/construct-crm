"use server";

import type { Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { parseISTInput } from "@/lib/datetime";
import { revalidateTasks } from "@/lib/revalidate";
import { taskSchema, type TaskInput } from "@/lib/validators";
import { requireEdit, requireView } from "@/lib/auth";
import { recordChange } from "@/lib/audit";

function emptyToNull(v?: string | null) {
  return v && v.trim() ? v.trim() : null;
}

export async function getTasks() {
  await requireView("tasks");
  return db.task.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });
}

export async function createTask(raw: TaskInput) {
  await requireEdit("tasks");
  const data = taskSchema.parse(raw);
  const task = await db.task.create({
    data: {
      title: data.title.trim(),
      dueDate: emptyToNull(data.dueDate) ? parseISTInput(data.dueDate!) : null,
      priority: data.priority as Priority,
    },
  });
  await recordChange({
    action: "created",
    entityType: "Task",
    entityId: task.id,
    entityLabel: task.title,
    summary: `Created task ${task.title}`,
  });
  revalidateTasks();
  return task;
}

export async function toggleTask(id: string, completed: boolean) {
  await requireEdit("tasks");
  const task = await db.task.update({
    where: { id },
    data: { completed },
  });
  await recordChange({
    action: "updated",
    entityType: "Task",
    entityId: task.id,
    entityLabel: task.title,
    summary: completed
      ? `Completed task ${task.title}`
      : `Reopened task ${task.title}`,
  });
  revalidateTasks();
  return task;
}

export async function deleteTask(id: string) {
  await requireEdit("tasks");
  const task = await db.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");
  await db.task.delete({ where: { id } });
  await recordChange({
    action: "deleted",
    entityType: "Task",
    entityId: id,
    entityLabel: task.title,
    summary: `Deleted task ${task.title}`,
  });
  revalidateTasks();
}
