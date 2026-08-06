"use server";

import type { Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { parseISTInput } from "@/lib/datetime";
import { revalidateTasks } from "@/lib/revalidate";
import { taskSchema, type TaskInput } from "@/lib/validators";

function emptyToNull(v?: string | null) {
  return v && v.trim() ? v.trim() : null;
}

export async function getTasks() {
  return db.task.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });
}

export async function createTask(raw: TaskInput) {
  const data = taskSchema.parse(raw);
  const task = await db.task.create({
    data: {
      title: data.title.trim(),
      dueDate: emptyToNull(data.dueDate) ? parseISTInput(data.dueDate!) : null,
      priority: data.priority as Priority,
    },
  });
  revalidateTasks();
  return task;
}

export async function toggleTask(id: string, completed: boolean) {
  const task = await db.task.update({
    where: { id },
    data: { completed },
  });
  revalidateTasks();
  return task;
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidateTasks();
}
