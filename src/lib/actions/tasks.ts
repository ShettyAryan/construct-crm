"use server";

import { revalidatePath } from "next/cache";
import type { Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { parseISTInput } from "@/lib/datetime";
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
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function toggleTask(id: string, completed: boolean) {
  const task = await db.task.update({
    where: { id },
    data: { completed },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}
