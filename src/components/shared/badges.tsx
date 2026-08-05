import type { Priority, LeadStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";

const priorityClass: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-secondary text-secondary-foreground",
  High: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Hot: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const statusClass: Record<LeadStatus, string> = {
  New: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  Qualified: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  Discovery: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  ProposalSent: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Negotiation: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Won: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Lost: "bg-muted text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", priorityClass[priority])}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", statusClass[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function AgencyBadge({ agency }: { agency: string }) {
  return (
    <Badge variant="outline" className="font-normal">
      {agency}
    </Badge>
  );
}
