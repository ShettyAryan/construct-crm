"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { FollowUp, Lead } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/badges";
import { ScheduleFollowUpSheet } from "@/components/activity/schedule-follow-up-sheet";
import { formatISTDate } from "@/lib/datetime";
import { toggleFollowUp } from "@/lib/actions/activity";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Row = FollowUp & { lead: Lead | null };

export function FollowUpsView({
  followUps,
  leads,
}: {
  followUps: Row[];
  leads: { id: string; company: string; contact: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [pending, startTransition] = useTransition();

  const filtered = followUps.filter((f) => {
    if (filter === "pending") return !f.completed;
    if (filter === "completed") return f.completed;
    return true;
  });

  function onToggle(id: string, checked: boolean) {
    startTransition(async () => {
      try {
        await toggleFollowUp(id, checked);
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Reminders and next touches · Times in IST"
        actions={
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Schedule
          </Button>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["all", "pending", "completed"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            className="shrink-0"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          description="Schedule a reminder to stay on top of deals."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Schedule
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "flex gap-3 rounded-lg border p-3.5",
                  f.completed && "opacity-60"
                )}
              >
                <Checkbox
                  checked={f.completed}
                  disabled={pending}
                  className="mt-1"
                  onCheckedChange={(checked) => onToggle(f.id, Boolean(checked))}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {f.lead ? (
                        <Link
                          href={`/leads/${f.lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {f.lead.company}
                        </Link>
                      ) : (
                        <p className="font-medium">General</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatISTDate(f.date)}
                        {f.time ? ` · ${f.time}` : ""}
                      </p>
                    </div>
                    <PriorityBadge priority={f.priority} />
                  </div>
                  <p className="mt-2 text-sm break-words">
                    {f.reminder ?? "Follow-up"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {f.completed ? "Completed" : "Pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Date (IST)</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow
                    key={f.id}
                    className={f.completed ? "opacity-60" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={f.completed}
                        disabled={pending}
                        onCheckedChange={(checked) =>
                          onToggle(f.id, Boolean(checked))
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatISTDate(f.date)}
                      {f.time ? ` · ${f.time}` : ""}
                    </TableCell>
                    <TableCell>
                      {f.lead ? (
                        <Link
                          href={`/leads/${f.lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {f.lead.company}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{f.reminder ?? "—"}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={f.priority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.completed ? "Completed" : "Pending"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <ScheduleFollowUpSheet open={open} onOpenChange={setOpen} leads={leads} />
    </div>
  );
}
