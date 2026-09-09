"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Lead, Poc } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { AppSelect } from "@/components/shared/app-select";
import {
  AgencyBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/shared/badges";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { formatISTDate, formatISTShort } from "@/lib/datetime";
import { formatPocName, getPrimaryPoc } from "@/lib/poc";
import {
  AGENCIES,
  LEAD_STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  formatBudget,
} from "@/lib/constants";

const ALL = "all";

const agencyFilterOptions = [
  { value: ALL, label: "All agencies" },
  ...AGENCIES.map((a) => ({ value: a, label: a })),
];

const statusFilterOptions = [
  { value: ALL, label: "All statuses" },
  ...LEAD_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const priorityFilterOptions = [
  { value: ALL, label: "All priorities" },
  ...PRIORITIES.map((p) => ({ value: p, label: p })),
];

type LeadRow = Lead & { pocs: Poc[] };

export function LeadsView({
  leads,
  initialAgency = ALL,
  initialStatus = ALL,
  initialPriority = ALL,
  initialOpenOnly = false,
}: {
  leads: LeadRow[];
  initialAgency?: string;
  initialStatus?: string;
  initialPriority?: string;
  initialOpenOnly?: boolean;
}) {
  const [q, setQ] = useState("");
  const [agency, setAgency] = useState(initialAgency);
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [openOnly] = useState(initialOpenOnly);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return leads.filter((lead) => {
      if (openOnly && (lead.status === "Won" || lead.status === "Lost")) {
        return false;
      }
      if (agency !== ALL && lead.agency !== agency) return false;
      if (status !== ALL && lead.status !== status) return false;
      if (priority !== ALL && lead.priority !== priority) return false;
      if (!query) return true;
      const pocMatch = lead.pocs.some(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.email?.toLowerCase().includes(query) ?? false) ||
          (p.phone?.toLowerCase().includes(query) ?? false)
      );
      return (
        lead.company.toLowerCase().includes(query) ||
        pocMatch ||
        (lead.city?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [leads, q, agency, status, priority, openOnly]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search company, POC, email…"
            className="w-full sm:max-w-xs sm:flex-1"
          />
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <AppSelect
              value={agency}
              onValueChange={setAgency}
              options={agencyFilterOptions}
              triggerClassName="w-full sm:w-[140px]"
            />
            <AppSelect
              value={status}
              onValueChange={setStatus}
              options={statusFilterOptions}
              triggerClassName="w-full sm:w-[150px]"
            />
            <AppSelect
              value={priority}
              onValueChange={setPriority}
              options={priorityFilterOptions}
              triggerClassName="w-full sm:w-[140px]"
            />
          </div>
        </div>
        <Button className="w-full sm:w-auto sm:self-start" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New lead
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Create your first lead to start tracking the pipeline."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New lead
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((lead) => {
              const poc = getPrimaryPoc(lead.pocs);
              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="rounded-lg border bg-card p-3.5 transition-colors active:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{lead.company}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {formatPocName(lead.pocs)}
                        {lead.city ? ` · ${lead.city}` : ""}
                      </p>
                    </div>
                    <PriorityBadge priority={lead.priority} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <AgencyBadge agency={lead.agency} />
                    <StatusBadge status={lead.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBudget(lead.budget)}</span>
                    <span>
                      {lead.nextFollowUp
                        ? formatISTShort(lead.nextFollowUp)
                        : "No follow-up"}
                    </span>
                  </div>
                  {poc?.email ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {poc.email}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>POC</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Next follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => {
                  const poc = getPrimaryPoc(lead.pocs);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {lead.company}
                        </Link>
                        {lead.city ? (
                          <p className="text-xs text-muted-foreground">{lead.city}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div>{formatPocName(lead.pocs)}</div>
                        {poc?.email ? (
                          <p className="text-xs text-muted-foreground">{poc.email}</p>
                        ) : null}
                        {lead.pocs.length > 1 ? (
                          <p className="text-xs text-muted-foreground">
                            +{lead.pocs.length - 1} more
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <AgencyBadge agency={lead.agency} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={lead.priority} />
                      </TableCell>
                      <TableCell>{formatBudget(lead.budget)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.nextFollowUp
                          ? formatISTDate(lead.nextFollowUp)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <LeadFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
