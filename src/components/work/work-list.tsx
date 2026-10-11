"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClientRecordButton } from "@/components/work/client-work-switch";
import { WorkCalendar } from "@/components/work/work-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AppSelect } from "@/components/shared/app-select";
import { Badge } from "@/components/ui/badge";
import { useCanEdit } from "@/components/auth/access-context";
import { createProject } from "@/lib/actions/work";
import { formatISTDate, formatISTDateTime } from "@/lib/datetime";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatusValue,
} from "@/lib/project-status";

const statusOptions = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status],
}));

export type WorkProjectRow = {
  id: string;
  name: string;
  status: ProjectStatusValue;
  updatedAt: string;
  client: { id: string; company: string; leadId: string };
  managerName: string | null;
  lastUpdate: string | null;
  deadline: string | null;
  progress: number;
};

export function WorkList({
  projects,
  clients,
  managers,
  clientId,
}: {
  projects: WorkProjectRow[];
  clients: { id: string; company: string; leadId: string }[];
  managers: { id: string; name: string }[];
  clientId?: string;
}) {
  const canEdit = useCanEdit("work");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [open, setOpen] = useState(Boolean(clientId) && projects.length === 0 && canEdit);
  const [name, setName] = useState("");
  const [selectedClient, setSelectedClient] = useState(clientId || clients[0]?.id || "");
  const [managerId, setManagerId] = useState("");
  const [status, setStatus] = useState<ProjectStatusValue>("NotStarted");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const focusedClient = clients.find((client) => client.id === clientId);

  async function onCreate() {
    setSaving(true);
    try {
      await createProject({
        name,
        clientId: selectedClient,
        managerId: managerId || null,
        status,
        summary,
      });
      toast.success("Project opened");
      setOpen(false);
      setName("");
      setSummary("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Ongoing work"
        description={
          focusedClient
            ? `Projects linked to ${focusedClient.company}`
            : "Delivery for clients in the client track"
        }
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/70 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs",
                  view === "calendar" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
                )}
                onClick={() => setView("calendar")}
              >
                Calendar
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs",
                  view === "list" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
                )}
                onClick={() => setView("list")}
              >
                List
              </button>
            </div>
            {canEdit ? (
              <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New project
              </Button>
            ) : null}
          </div>
        }
      />

      {focusedClient ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/work"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            All projects
          </Link>
          <ClientRecordButton leadId={focusedClient.leadId} />
        </div>
      ) : null}

      {view === "calendar" ? (
        <div className="mb-6">
          <WorkCalendar projects={projects} canEdit={canEdit} />
        </div>
      ) : null}

      {view === "list" && projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Open a project for a client to track who manages it and what changed."
          action={
            canEdit ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New project
              </Button>
            ) : undefined
          }
        />
      ) : view === "list" ? (
        <ul className="grid gap-3">
          {projects.map((project) => (
            <li key={project.id} className="rounded-lg border">
              <div className="flex flex-wrap items-start justify-between gap-3 p-3 sm:p-4">
                <Link href={`/work/${project.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{project.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {project.client.company}
                    {project.managerName ? ` · ${project.managerName}` : " · No manager"}
                    {` · ${project.progress}%`}
                    {project.deadline ? ` · due ${formatISTDate(project.deadline)}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {project.lastUpdate
                      ? `Latest: ${project.lastUpdate}`
                      : "No updates yet"}
                    {" · "}
                    {formatISTDateTime(project.updatedAt)} IST
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={project.status} />
                  <ClientRecordButton leadId={project.client.leadId} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="project-name">Project</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Client</Label>
              <AppSelect
                value={selectedClient}
                onValueChange={setSelectedClient}
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.company,
                }))}
                placeholder="Choose a client"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Manager</Label>
              <AppSelect
                value={managerId || "none"}
                onValueChange={(value) => setManagerId(value === "none" ? "" : value)}
                options={[
                  { value: "none", label: "Unassigned" },
                  ...managers.map((manager) => ({
                    value: manager.id,
                    label: manager.name,
                  })),
                ]}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <AppSelect
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatusValue)}
                options={statusOptions}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-summary">Summary</Label>
              <Textarea
                id="project-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving || clients.length === 0} onClick={onCreate}>
              {saving ? "Saving…" : "Open project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatusValue }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-0 font-medium",
        status === "Completed" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "InProgress" && "bg-sky-500/15 text-sky-700 dark:text-sky-400",
        status === "OnHold" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        status === "InReview" && "bg-violet-500/15 text-violet-700 dark:text-violet-400"
      )}
    >
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}
