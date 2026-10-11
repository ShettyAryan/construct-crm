"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { AppSelect } from "@/components/shared/app-select";
import { useCanEdit } from "@/components/auth/access-context";
import { ClientRecordButton } from "@/components/work/client-work-switch";
import {
  addProjectUpdate,
  updateProjectDeadline,
  updateProjectManager,
  updateProjectProgress,
  updateProjectStatus,
} from "@/lib/actions/work";
import { formatISTDateTime, toISTDateInput } from "@/lib/datetime";
import { Input } from "@/components/ui/input";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatusValue,
} from "@/lib/project-status";

const statusOptions = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status],
}));

export type WorkDetail = {
  id: string;
  name: string;
  status: ProjectStatusValue;
  summary: string | null;
  client: { id: string; company: string; leadId: string };
  managerId: string | null;
  deadline: string | null;
  progress: number;
  updates: {
    id: string;
    body: string;
    authorName: string;
    authorLogin: string;
    createdAt: string;
  }[];
};

export function WorkDetailView({
  project,
  managers,
}: {
  project: WorkDetail;
  managers: { id: string; name: string }[];
}) {
  const canEdit = useCanEdit("work");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(project.progress);
  useEffect(() => {
    setProgress(project.progress);
  }, [project.progress]);

  async function onStatus(status: string) {
    try {
      await updateProjectStatus(project.id, status);
      toast.success("Status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    }
  }

  async function onManager(managerId: string) {
    try {
      await updateProjectManager(project.id, managerId === "none" ? "" : managerId);
      toast.success("Manager updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update manager");
    }
  }

  async function onDeadline(value: string) {
    try {
      await updateProjectDeadline(project.id, value || null);
      toast.success(value ? "Deadline set" : "Deadline cleared");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update deadline");
    }
  }

  async function onProgress(value: number) {
    try {
      await updateProjectProgress(project.id, value);
    } catch (error) {
      setProgress(project.progress);
      toast.error(error instanceof Error ? error.message : "Could not update progress");
    }
  }

  async function onUpdate() {
    setSaving(true);
    try {
      await addProjectUpdate(project.id, note);
      setNote("");
      toast.success("Update added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.client.company}
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <ClientRecordButton leadId={project.client.leadId} />
            <Link
              href={`/work?client=${project.client.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              This client&apos;s projects
            </Link>
            <Link
              href="/work"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              All projects
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-lg border p-3 sm:p-4">
          <div className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">Status</p>
            <AppSelect
              value={project.status}
              onValueChange={onStatus}
              options={statusOptions}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">Manager</p>
            <AppSelect
              value={project.managerId || "none"}
              onValueChange={onManager}
              options={[
                { value: "none", label: "Unassigned" },
                ...managers.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                })),
              ]}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">Deadline</p>
            <Input
              type="date"
              value={project.deadline ? toISTDateInput(project.deadline) : ""}
              disabled={!canEdit}
              onChange={(event) => onDeadline(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">Progress</p>
              <p>{progress}%</p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              disabled={!canEdit}
              aria-label="Project progress"
              className="w-full accent-foreground"
              onChange={(event) => setProgress(Number(event.target.value))}
              onPointerUp={(event) => onProgress(Number(event.currentTarget.value))}
              onKeyUp={(event) => onProgress(Number(event.currentTarget.value))}
            />
          </div>
          {project.summary ? (
            <div>
              <p className="text-xs text-muted-foreground">Summary</p>
              <p className="mt-1 text-sm">{project.summary}</p>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium">Timeline</h2>
          {canEdit ? (
            <div className="mb-4 grid gap-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What changed on this project?"
              />
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={saving}
                onClick={onUpdate}
              >
                {saving ? "Saving…" : "Add update"}
              </Button>
            </div>
          ) : null}

          {project.updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <ol className="relative ml-3 border-l border-border">
              {project.updates.map((update, index) => (
                <li key={update.id} className="relative pb-6 pl-6 last:pb-0">
                  <span
                    className={`absolute -left-1.5 mt-1.5 size-3 rounded-full border bg-background ${
                      index === 0 ? "ring-2 ring-foreground/10" : ""
                    }`}
                  />
                  <p className="text-sm">{update.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {update.authorName} ({update.authorLogin}) ·{" "}
                    {formatISTDateTime(update.createdAt)} IST
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
