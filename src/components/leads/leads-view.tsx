"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import type { Lead } from "@prisma/client";
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

export function LeadsView({ leads }: { leads: Lead[] }) {
  const [q, setQ] = useState("");
  const [agency, setAgency] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return leads.filter((lead) => {
      if (agency !== ALL && lead.agency !== agency) return false;
      if (status !== ALL && lead.status !== status) return false;
      if (priority !== ALL && lead.priority !== priority) return false;
      if (!query) return true;
      return (
        lead.company.toLowerCase().includes(query) ||
        lead.contact.toLowerCase().includes(query) ||
        (lead.email?.toLowerCase().includes(query) ?? false) ||
        (lead.city?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [leads, q, agency, status, priority]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search company, contact, email…"
            className="w-full sm:max-w-xs"
          />
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
        <Button onClick={() => setOpen(true)}>
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
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Next follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer">
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
                    <div>{lead.contact}</div>
                    {lead.email ? (
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
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
                      ? format(lead.nextFollowUp, "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
