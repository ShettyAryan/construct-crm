"use client";

import { useEffect, useState } from "react";
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
import { AppSelect } from "@/components/shared/app-select";
import { PRIORITIES } from "@/lib/constants";
import { todayISTDateInput } from "@/lib/datetime";
import { followUpSchema, type FollowUpInput } from "@/lib/validators";
import { scheduleFollowUp } from "@/lib/actions/activity";

const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p }));

export type LeadOption = { id: string; company: string; contact: string };

export function ScheduleFollowUpSheet({
  open,
  onOpenChange,
  leadId,
  leads = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leads?: LeadOption[];
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      leadId: leadId ?? "",
      date: todayISTDateInput(),
      time: "10:00",
      priority: "Medium",
      reminder: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        leadId: leadId ?? "",
        date: todayISTDateInput(),
        time: "10:00",
        priority: "Medium",
        reminder: "",
      });
    }
  }, [open, leadId, form]);

  const showLeadPicker = !leadId && leads.length > 0;
  const leadOptions = leads.map((l) => ({
    value: l.id,
    label: `${l.company} · ${l.contact}`,
  }));

  const onSubmit = form.handleSubmit(async (values) => {
    const resolvedLeadId = leadId || values.leadId;
    if (!resolvedLeadId) {
      toast.error("Select a lead for this follow-up");
      return;
    }

    setSaving(true);
    try {
      await scheduleFollowUp({ ...values, leadId: resolvedLeadId });
      toast.success("Follow-up scheduled");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Schedule follow-up</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={onSubmit}
          className="mt-0 flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
        >
          {showLeadPicker ? (
            <div className="grid gap-1.5">
              <Label>Lead</Label>
              <AppSelect
                value={form.watch("leadId") || ""}
                onValueChange={(v) =>
                  form.setValue("leadId", v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={leadOptions}
                placeholder="Select lead"
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label>Date (IST)</Label>
            <Input type="date" {...form.register("date")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Time (IST)</Label>
            <Input type="time" {...form.register("time")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <AppSelect
              value={form.watch("priority")}
              onValueChange={(v) =>
                form.setValue("priority", v as FollowUpInput["priority"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={priorityOptions}
              placeholder="Select priority"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Reminder</Label>
            <Textarea rows={3} {...form.register("reminder")} />
          </div>
          <SheetFooter className="mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Schedule"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
