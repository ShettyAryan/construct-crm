"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { Lead, Poc } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/shared/app-select";
import {
  AGENCIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITIES,
  SERVICE_OPTIONS,
  STATUS_LABELS,
  parseJsonArray,
} from "@/lib/constants";
import { leadSchema, type LeadInput } from "@/lib/validators";
import { createLead, updateLead } from "@/lib/actions/leads";
import { toISTDateInput } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const NONE = "__none__";

const agencyOptions = AGENCIES.map((a) => ({ value: a, label: a }));
const sourceOptions = [
  { value: NONE, label: "Select source" },
  ...LEAD_SOURCES.map((s) => ({ value: s, label: s })),
];
const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p }));
const statusOptions = LEAD_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

type LeadWithPocs = Lead & { pocs?: Poc[] };

function emptyPoc(isPrimary = false): LeadInput["pocs"][number] {
  return {
    name: "",
    email: "",
    phone: "",
    role: "",
    linkedin: "",
    isPrimary,
  };
}

function toDefaultValues(lead?: LeadWithPocs): LeadInput {
  if (!lead) {
    return {
      company: "",
      website: "",
      linkedin: "",
      industry: "",
      city: "",
      agency: "ConstructDev",
      services: [],
      budget: null,
      source: "",
      priority: "Medium",
      status: "New",
      notes: "",
      nextFollowUp: "",
      pocs: [emptyPoc(true)],
    };
  }
  return {
    company: lead.company,
    website: lead.website ?? "",
    linkedin: lead.linkedin ?? "",
    industry: lead.industry ?? "",
    city: lead.city ?? "",
    agency: lead.agency,
    services: parseJsonArray(lead.services),
    budget: lead.budget,
    source: lead.source ?? "",
    priority: lead.priority,
    status: lead.status,
    notes: lead.notes ?? "",
    nextFollowUp: lead.nextFollowUp ? toISTDateInput(lead.nextFollowUp) : "",
    pocs:
      lead.pocs && lead.pocs.length > 0
        ? lead.pocs.map((p) => ({
            name: p.name,
            email: p.email ?? "",
            phone: p.phone ?? "",
            role: p.role ?? "",
            linkedin: p.linkedin ?? "",
            isPrimary: p.isPrimary,
          }))
        : [emptyPoc(true)],
  };
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadWithPocs;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    values: toDefaultValues(lead),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pocs",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      if (lead) {
        await updateLead(lead.id, values);
        toast.success("Lead updated");
      } else {
        await createLead(values);
        toast.success("Lead created");
      }
      onOpenChange(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  });

  const services = form.watch("services") ?? [];
  const agency = form.watch("agency");
  const source = form.watch("source") || NONE;
  const priority = form.watch("priority");
  const status = form.watch("status");
  const pocs = form.watch("pocs") ?? [];

  function setPrimary(index: number) {
    fields.forEach((_, i) => {
      form.setValue(`pocs.${i}.isPrimary`, i === index, { shouldDirty: true });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,92vh)] w-[calc(100%-1.5rem)] flex-col overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-4 pt-4 pr-12">
          <DialogTitle>{lead ? "Edit lead" : "New lead"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className="grid flex-1 gap-4 overflow-y-auto px-4 pb-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" error={form.formState.errors.company?.message}>
              <Input {...form.register("company")} />
            </Field>
            <Field label="Website">
              <Input {...form.register("website")} />
            </Field>
            <Field label="Company LinkedIn">
              <Input {...form.register("linkedin")} />
            </Field>
            <Field label="Industry">
              <Input {...form.register("industry")} />
            </Field>
            <Field label="City">
              <Input {...form.register("city")} />
            </Field>
            <Field label="Agency">
              <AppSelect
                value={agency}
                onValueChange={(v) =>
                  form.setValue("agency", v as LeadInput["agency"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={agencyOptions}
                placeholder="Select agency"
              />
            </Field>
            <Field label="Source">
              <AppSelect
                value={source}
                onValueChange={(v) =>
                  form.setValue("source", v === NONE ? "" : v, {
                    shouldDirty: true,
                  })
                }
                options={sourceOptions}
                placeholder="Select source"
              />
            </Field>
            <Field label="Budget (INR)">
              <Input type="number" {...form.register("budget")} />
            </Field>
            <Field label="Next follow-up (IST)">
              <Input type="date" {...form.register("nextFollowUp")} />
            </Field>
            <Field label="Priority">
              <AppSelect
                value={priority}
                onValueChange={(v) =>
                  form.setValue("priority", v as LeadInput["priority"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={priorityOptions}
                placeholder="Select priority"
              />
            </Field>
            <Field label="Status">
              <AppSelect
                value={status}
                onValueChange={(v) =>
                  form.setValue("status", v as LeadInput["status"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={statusOptions}
                placeholder="Select status"
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>Points of contact</Label>
                {form.formState.errors.pocs?.message ||
                form.formState.errors.pocs?.root?.message ? (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.pocs?.message ||
                      form.formState.errors.pocs?.root?.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyPoc(false))}
              >
                <Plus className="size-3.5" />
                Add POC
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className={cn(
                        "text-xs font-medium",
                        pocs[index]?.isPrimary
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {pocs[index]?.isPrimary ? "Primary POC" : "Set as primary"}
                    </button>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const wasPrimary = pocs[index]?.isPrimary;
                          remove(index);
                          if (wasPrimary) {
                            queueMicrotask(() => setPrimary(0));
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Name"
                      error={form.formState.errors.pocs?.[index]?.name?.message}
                    >
                      <Input {...form.register(`pocs.${index}.name`)} />
                    </Field>
                    <Field label="Role / title">
                      <Input
                        placeholder="e.g. CTO, Founder"
                        {...form.register(`pocs.${index}.role`)}
                      />
                    </Field>
                    <Field
                      label="Email"
                      error={form.formState.errors.pocs?.[index]?.email?.message}
                    >
                      <Input
                        type="email"
                        {...form.register(`pocs.${index}.email`)}
                      />
                    </Field>
                    <Field label="Phone">
                      <Input {...form.register(`pocs.${index}.phone`)} />
                    </Field>
                    <Field label="LinkedIn" className="sm:col-span-2">
                      <Input {...form.register(`pocs.${index}.linkedin`)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field label="Interested services">
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((service) => {
                const checked = services.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      const next = checked
                        ? services.filter((s) => s !== service)
                        : [...services, service];
                      form.setValue("services", next, { shouldDirty: true });
                    }}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs transition-colors",
                      checked
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/40"
                    )}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Notes">
            <Textarea rows={3} {...form.register("notes")} />
          </Field>

          <DialogFooter className="sticky bottom-0 -mx-4 border-t bg-popover px-4 py-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving…" : lead ? "Save changes" : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
