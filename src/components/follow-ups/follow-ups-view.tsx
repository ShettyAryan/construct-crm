"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { FollowUp, Lead, Poc } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/badges";
import { ScheduleFollowUpSheet } from "@/components/activity/schedule-follow-up-sheet";
import { formatISTDate } from "@/lib/datetime";
import { completeFollowUp } from "@/lib/actions/activity";
import { useCanEdit } from "@/components/auth/access-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = FollowUp & {
  lead: (Lead & { pocs: Pick<Poc, "name">[] }) | null;
};

export function FollowUpsView({
  followUps,
  leads,
}: {
  followUps: Row[];
  leads: { id: string; company: string; pocs: { name: string }[] }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const canEditFollowUps = useCanEdit("followUps");

  function onComplete(id: string) {
    startTransition(async () => {
      try {
        await completeFollowUp(id);
        toast.success("Follow-up completed");
      } catch {
        toast.error("Failed to complete follow-up");
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Reminders and next touches · Times in IST"
        actions={
          canEditFollowUps ? (
            <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Schedule
            </Button>
          ) : null
        }
      />

      {followUps.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          description="Schedule a reminder to stay on top of deals."
          action={
            canEditFollowUps ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Schedule
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {followUps.map((f) => (
              <div key={f.id} className="flex gap-3 rounded-lg border p-3.5">
                <Checkbox
                  checked={false}
                  disabled={pending || !canEditFollowUps}
                  className="mt-1"
                  onCheckedChange={(checked) => {
                    if (checked) onComplete(f.id);
                  }}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Checkbox
                        checked={false}
                        disabled={pending || !canEditFollowUps}
                        onCheckedChange={(checked) => {
                          if (checked) onComplete(f.id);
                        }}
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
