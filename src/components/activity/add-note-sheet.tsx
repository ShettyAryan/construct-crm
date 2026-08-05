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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { noteSchema, type NoteInput } from "@/lib/validators";
import { addNote } from "@/lib/actions/activity";

export function AddNoteSheet({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: { leadId, body: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await addNote({ ...values, leadId });
      toast.success("Note added");
      onOpenChange(false);
      form.reset({ leadId, body: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add note</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-0 flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="grid gap-1.5">
            <Label>Note</Label>
            <Textarea rows={6} {...form.register("body")} />
            {form.formState.errors.body ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.body.message}
              </p>
            ) : null}
          </div>
          <SheetFooter className="mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save note"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
