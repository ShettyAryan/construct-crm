"use client";

import Link from "next/link";
import { Briefcase, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCanView } from "@/components/auth/access-context";
import { cn } from "@/lib/utils";

export function OngoingWorkButton({
  clientId,
  className,
}: {
  clientId: string;
  className?: string;
}) {
  const canView = useCanView("work");
  if (!canView) return null;

  return (
    <Link
      href={`/work?client=${clientId}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      <Briefcase />
      Ongoing work
    </Link>
  );
}

export function ClientRecordButton({
  leadId,
  className,
}: {
  leadId: string;
  className?: string;
}) {
  const canViewLeads = useCanView("leads");
  const canViewClients = useCanView("clients");
  const canViewPipeline = useCanView("pipeline");
  const canViewTracks = useCanView("tracks");
  if (!canViewLeads && !canViewClients && !canViewPipeline && !canViewTracks) {
    return null;
  }

  return (
    <Link
      href={`/leads/${leadId}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      <Building2 />
      Client record
    </Link>
  );
}
