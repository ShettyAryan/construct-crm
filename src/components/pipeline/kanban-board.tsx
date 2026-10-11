"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lead, LeadStatus, Poc } from "@prisma/client";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/shared/badges";
import { formatISTShort } from "@/lib/datetime";
import {
  PIPELINE_STATUSES,
  STATUS_LABELS,
  formatBudget,
} from "@/lib/constants";
import { updateLeadStatus } from "@/lib/actions/leads";
import { formatPocName } from "@/lib/poc";
import { useCanEdit } from "@/components/auth/access-context";
import { cn } from "@/lib/utils";

type LeadCard = Lead & { pocs: Poc[] };

export function KanbanBoard({ leads }: { leads: LeadCard[] }) {
  const [items, setItems] = useState(leads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canEditPipeline = useCanEdit("pipeline");

  useEffect(() => {
    setItems(leads);
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: canEditPipeline ? 6 : 10_000 },
    })
  );

  const columns = useMemo(() => {
    const map = Object.fromEntries(
      PIPELINE_STATUSES.map((s) => [s, [] as LeadCard[]])
    ) as Record<LeadStatus, LeadCard[]>;
    for (const lead of items) {
      map[lead.status].push(lead);
    }
    return map;
  }, [items]);

  const activeLead = activeId
    ? items.find((l) => l.id === activeId) ?? null
    : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!canEditPipeline) return;
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const overId = String(over.id);

    let newStatus: LeadStatus | null = null;
    if (PIPELINE_STATUSES.includes(overId as LeadStatus)) {
      newStatus = overId as LeadStatus;
    } else {
      const overLead = items.find((l) => l.id === overId);
      if (overLead) newStatus = overLead.status;
    }

    if (!newStatus) return;
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previous = items;
    setItems((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus! } : l))
    );

    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, newStatus!);
        toast.success(`Moved to ${STATUS_LABELS[newStatus!]}`);
      } catch {
        setItems(previous);
        toast.error("Failed to update status");
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={cn(
          "-mx-3 flex gap-3 overflow-x-auto px-3 pb-4 snap-x snap-mandatory sm:mx-0 sm:px-0",
          "[scrollbar-width:thin]",
          pending && "opacity-90"
        )}
      >
        {PIPELINE_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={columns[status]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  leads,
}: {
  status: LeadStatus;
  leads: LeadCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[min(85vw,16.5rem)] shrink-0 snap-start flex-col rounded-lg border bg-muted/30 sm:w-64",
        "max-h-[min(70vh,36rem)]",
        isOver && "ring-2 ring-foreground/15"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-xs font-medium tracking-wide uppercase">
          {STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
          {leads.map((lead) => (
            <SortableKanbanCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableKanbanCard({ lead }: { lead: LeadCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <KanbanCard lead={lead} />
    </div>
  );
}

function KanbanCard({ lead, overlay }: { lead: LeadCard; overlay?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm",
        overlay && "shadow-lg ring-1 ring-foreground/10"
      )}
    >
      <Link
        href={`/leads/${lead.id}`}
        className="text-sm font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {lead.company}
      </Link>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatPocName(lead.pocs)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={lead.priority} />
        <span className="text-xs text-muted-foreground">
          {formatBudget(lead.budget)}
        </span>
      </div>
      {lead.nextFollowUp ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Follow-up {formatISTShort(lead.nextFollowUp)}
        </p>
      ) : null}
    </div>
  );
}
