"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import type { FollowUp, Lead } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/badges";
import { ScheduleFollowUpSheet } from "@/components/activity/schedule-follow-up-sheet";
import { toggleFollowUp } from "@/lib/actions/activity";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = FollowUp & { lead: Lead | null };

export function FollowUpsView({ followUps }: { followUps: Row[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [pending, startTransition] = useTransition();

  const filtered = followUps.filter((f) => {
    if (filter === "pending") return !f.completed;
    if (filter === "completed") return f.completed;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Reminders and next touches"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Schedule
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        {(["all", "pending", "completed"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
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
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Date</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id} className={f.completed ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={f.completed}
                      disabled={pending}
                      onCheckedChange={(checked) => {
                        startTransition(async () => {
                          try {
                            await toggleFollowUp(f.id, Boolean(checked));
                          } catch {
                            toast.error("Failed to update");
                          }
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(f.date, "MMM d, yyyy")}
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
      )}

      <ScheduleFollowUpSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}
