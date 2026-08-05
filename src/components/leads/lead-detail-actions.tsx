"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Lead } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LogCallSheet } from "@/components/activity/log-call-sheet";
import { AddNoteSheet } from "@/components/activity/add-note-sheet";
import { ScheduleFollowUpSheet } from "@/components/activity/schedule-follow-up-sheet";
import { LogMeetingSheet } from "@/components/activity/log-meeting-sheet";
import { deleteLead } from "@/lib/actions/leads";

export function LeadDetailActions({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setCallOpen(true)}>
          <Phone className="size-3.5" />
          Log call
        </Button>
        <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}>
          <StickyNote className="size-3.5" />
          Add note
        </Button>
        <Button variant="outline" size="sm" onClick={() => setFollowOpen(true)}>
          <Bell className="size-3.5" />
          Follow-up
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMeetingOpen(true)}>
          <Calendar className="size-3.5" />
          Meeting
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
      <LogCallSheet open={callOpen} onOpenChange={setCallOpen} leadId={lead.id} />
      <AddNoteSheet open={noteOpen} onOpenChange={setNoteOpen} leadId={lead.id} />
      <ScheduleFollowUpSheet
        open={followOpen}
        onOpenChange={setFollowOpen}
        leadId={lead.id}
      />
      <LogMeetingSheet
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        leadId={lead.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete lead?"
        description="This will permanently delete the lead and all related calls, meetings, and notes."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteLead(lead.id);
            toast.success("Lead deleted");
            router.push("/leads");
          } catch {
            toast.error("Failed to delete lead");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
