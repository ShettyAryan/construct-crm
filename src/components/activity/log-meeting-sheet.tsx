"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { meetingSchema, type MeetingInput } from "@/lib/validators";
import { logMeeting } from "@/lib/actions/activity";

export function LogMeetingSheet({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<MeetingInput>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      leadId,
      date: new Date().toISOString().slice(0, 16),
      summary: "",
      painPoints: "",
      requirements: "",
      nextSteps: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await logMeeting({ ...values, leadId });
      toast.success("Meeting logged");
      onOpenChange(false);
      form.reset({
        leadId,
        date: new Date().toISOString().slice(0, 16),
        summary: "",
        painPoints: "",
        requirements: "",
        nextSteps: "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log meeting");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Log meeting</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-4 flex flex-1 flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Date & time</Label>
            <Input type="datetime-local" {...form.register("date")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Summary</Label>
            <Textarea rows={3} {...form.register("summary")} />
            {form.formState.errors.summary ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.summary.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label>Pain points</Label>
            <Textarea rows={2} {...form.register("painPoints")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Requirements</Label>
            <Textarea rows={2} {...form.register("requirements")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Next steps</Label>
            <Textarea rows={2} {...form.register("nextSteps")} />
          </div>
          <SheetFooter className="mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save meeting"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
