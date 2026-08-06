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
import { AppSelect } from "@/components/shared/app-select";
import { PRIORITIES } from "@/lib/constants";
import { todayISTDateInput } from "@/lib/datetime";
import { followUpSchema, type FollowUpInput } from "@/lib/validators";
import { scheduleFollowUp } from "@/lib/actions/activity";

const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p }));

export function ScheduleFollowUpSheet({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
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

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await scheduleFollowUp({ ...values, leadId: leadId ?? values.leadId });
      toast.success("Follow-up scheduled");
      onOpenChange(false);
      form.reset({
        leadId: leadId ?? "",
        date: todayISTDateInput(),
        time: "10:00",
        priority: "Medium",
        reminder: "",
      });
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
