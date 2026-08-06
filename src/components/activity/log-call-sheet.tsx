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
import { callSchema, type CallInput } from "@/lib/validators";
import { nowISTDateTimeInput } from "@/lib/datetime";
import { logCall } from "@/lib/actions/activity";

export function LogCallSheet({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<CallInput>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      leadId,
      date: nowISTDateTimeInput(),
      durationMin: 15,
      outcome: "",
      summary: "",
      nextAction: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await logCall({ ...values, leadId });
      toast.success("Call logged");
      onOpenChange(false);
      form.reset({
        leadId,
        date: nowISTDateTimeInput(),
        durationMin: 15,
        outcome: "",
        summary: "",
        nextAction: "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log call");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Log call</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-0 flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="grid gap-1.5">
            <Label>Date & time (IST)</Label>
            <Input type="datetime-local" {...form.register("date")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" {...form.register("durationMin")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Outcome</Label>
            <Input placeholder="Positive, Callback…" {...form.register("outcome")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Summary</Label>
            <Textarea rows={4} {...form.register("summary")} />
            {form.formState.errors.summary ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.summary.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label>Next action</Label>
            <Input {...form.register("nextAction")} />
          </div>
          <SheetFooter className="mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save call"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
