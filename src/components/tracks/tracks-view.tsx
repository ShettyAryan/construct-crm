"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Client, Lead, Poc } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AgencyBadge,
  PriorityBadge,
  StatusBadge,
  WorkStatusBadge,
} from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { OngoingWorkButton } from "@/components/work/client-work-switch";
import { formatBudget, STATUS_LABELS } from "@/lib/constants";
import { formatISTShort } from "@/lib/datetime";
import { updateClientWorkStatus } from "@/lib/actions/clients";
import { useCanEdit } from "@/components/auth/access-context";
import { formatPocName } from "@/lib/poc";

type LeadWithPocs = Lead & { pocs: Poc[] };
type ClientRow = Client & { lead: LeadWithPocs };

export function TracksView({
  activeLeads,
  ongoingClients,
  completedClients,
}: {
  activeLeads: LeadWithPocs[];
  ongoingClients: ClientRow[];
  completedClients: ClientRow[];
}) {
  const [pending, startTransition] = useTransition();

  function setWorkStatus(clientId: string, workStatus: "Ongoing" | "Completed") {
    startTransition(async () => {
      try {
        await updateClientWorkStatus(clientId, workStatus);
        toast.success(
          workStatus === "Completed"
            ? "Moved to completed clients"
            : "Moved to ongoing work"
        );
      } catch {
        toast.error("Failed to update work status");
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Tracks"
        description="Separate track records for active leads, ongoing work, and completed clients"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <TrackColumn
          title="Active leads"
          count={activeLeads.length}
          hint="Open pipeline — not won or lost"
        >
          {activeLeads.length === 0 ? (
            <EmptyState
              title="No active leads"
              description="New and in-progress deals appear here."
              className="border-0 py-8"
            />
          ) : (
            <ul className="space-y-2">
              {activeLeads.map((lead) => (
                <li key={lead.id} className="rounded-lg border bg-card p-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium hover:underline"
                  >
                    {lead.company}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPocName(lead.pocs)}
                    {lead.city ? ` · ${lead.city}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <AgencyBadge agency={lead.agency} />
                    <StatusBadge status={lead.status} />
                    <PriorityBadge priority={lead.priority} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{formatBudget(lead.budget)}</span>
                    <span>
                      {lead.nextFollowUp
                        ? `Follow-up ${formatISTShort(lead.nextFollowUp)}`
                        : STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TrackColumn>

        <TrackColumn
          title="Ongoing work"
          count={ongoingClients.length}
          hint="Won clients currently in delivery"
        >
          {ongoingClients.length === 0 ? (
            <EmptyState
              title="No ongoing work"
              description="Won deals stay here until you mark them completed."
              className="border-0 py-8"
            />
          ) : (
            <ul className="space-y-2">
              {ongoingClients.map((client) => (
                <ClientTrackCard
                  key={client.id}
                  client={client}
                  pending={pending}
                  actionLabel="Mark completed"
                  onAction={() => setWorkStatus(client.id, "Completed")}
                />
              ))}
            </ul>
          )}
        </TrackColumn>

        <TrackColumn
          title="Completed clients"
          count={completedClients.length}
          hint="Delivery finished"
        >
          {completedClients.length === 0 ? (
            <EmptyState
              title="No completed clients"
              description="Finished engagements appear here."
              className="border-0 py-8"
            />
          ) : (
            <ul className="space-y-2">
              {completedClients.map((client) => (
                <ClientTrackCard
                  key={client.id}
                  client={client}
                  pending={pending}
                  actionLabel="Reopen as ongoing"
                  onAction={() => setWorkStatus(client.id, "Ongoing")}
                />
              ))}
            </ul>
          )}
        </TrackColumn>
      </div>
    </div>
  );
}

function TrackColumn({
  title,
  count,
  hint,
  children,
}: {
  title: string;
  count: number;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-[20rem] flex-col rounded-lg border bg-muted/20">
      <div className="border-b px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">{title}</h2>
          <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
            {count}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex-1 p-2 sm:p-3">{children}</div>
    </section>
  );
}

function ClientTrackCard({
  client,
  pending,
  actionLabel,
  onAction,
}: {
  client: ClientRow;
  pending: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  const outstanding = Math.max(0, client.amountAgreed - client.amountCollected);
  const canEditClients = useCanEdit("clients");

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${client.leadId}`}
          className="font-medium hover:underline"
        >
          {client.company}
        </Link>
        <WorkStatusBadge status={client.workStatus} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <AgencyBadge agency={client.lead.agency} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Agreed</p>
          <p className="font-medium">{formatBudget(client.amountAgreed)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Collected</p>
          <p className="font-medium">{formatBudget(client.amountCollected)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Outstanding</p>
          <p className="font-medium">{formatBudget(outstanding)}</p>
        </div>
      </div>
      <OngoingWorkButton clientId={client.id} className="mt-3" />
      {canEditClients ? (
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={pending}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
      ) : null}
    </li>
  );
}
