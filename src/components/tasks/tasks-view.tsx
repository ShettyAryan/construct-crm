"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Task } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/badges";
import { AppSelect } from "@/components/shared/app-select";
import { PRIORITIES } from "@/lib/constants";
import { taskSchema, type TaskInput } from "@/lib/validators";
import { createTask, deleteTask, toggleTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p }));

export function TasksView({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", dueDate: "", priority: "Medium" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createTask(values);
      toast.success("Task created");
      setOpen(false);
      form.reset({ title: "", dueDate: "", priority: "Medium" });
    } catch {
      toast.error("Failed to create task");
    }
  });

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Simple personal task list"
        actions={
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New task
          </Button>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks"
          description="Add a task to track something outside the pipeline."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New task
            </Button>
          }
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={cn(
                "flex items-start gap-3 px-3 py-3 sm:items-center sm:px-4",
                task.completed && "opacity-60"
              )}
            >
              <Checkbox
                checked={task.completed}
                disabled={pending}
                className="mt-1 sm:mt-0"
                onCheckedChange={(checked) => {
                  startTransition(async () => {
                    try {
                      await toggleTask(task.id, Boolean(checked));
                    } catch {
                      toast.error("Failed to update");
                    }
                  });
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium break-words",
                    task.completed && "line-through"
                  )}
                >
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.dueDate
                    ? `Due ${format(task.dueDate, "MMM d, yyyy")}`
                    : "No due date"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <PriorityBadge priority={task.priority} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await deleteTask(task.id);
                        toast.success("Task deleted");
                      } catch {
                        toast.error("Failed to delete");
                      }
                    });
                  }}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Due date</Label>
              <Input type="date" {...form.register("dueDate")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <AppSelect
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", v as TaskInput["priority"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={priorityOptions}
                placeholder="Select priority"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
