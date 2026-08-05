import { z } from "zod";

export const leadSchema = z.object({
  company: z.string().min(1, "Company is required"),
  contact: z.string().min(1, "Contact is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  agency: z.enum(["ConstructDev", "ConstructXR"]),
  services: z.array(z.string()),
  budget: z.coerce.number().int().nonnegative().optional().nullable(),
  source: z.string().optional().or(z.literal("")),
  priority: z.enum(["Low", "Medium", "High", "Hot"]),
  status: z.enum([
    "New",
    "Qualified",
    "Discovery",
    "ProposalSent",
    "Negotiation",
    "Won",
    "Lost",
  ]),
  notes: z.string().optional().or(z.literal("")),
  nextFollowUp: z.string().optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const callSchema = z.object({
  leadId: z.string().min(1),
  date: z.string().min(1, "Date is required"),
  durationMin: z.coerce.number().int().nonnegative().optional().nullable(),
  outcome: z.string().optional().or(z.literal("")),
  summary: z.string().min(1, "Summary is required"),
  nextAction: z.string().optional().or(z.literal("")),
});

export type CallInput = z.infer<typeof callSchema>;

export const meetingSchema = z.object({
  leadId: z.string().min(1),
  date: z.string().min(1, "Date is required"),
  summary: z.string().min(1, "Summary is required"),
  painPoints: z.string().optional().or(z.literal("")),
  requirements: z.string().optional().or(z.literal("")),
  nextSteps: z.string().optional().or(z.literal("")),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

export const followUpSchema = z.object({
  leadId: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional().or(z.literal("")),
  priority: z.enum(["Low", "Medium", "High", "Hot"]),
  reminder: z.string().optional().or(z.literal("")),
});

export type FollowUpInput = z.infer<typeof followUpSchema>;

export const noteSchema = z.object({
  leadId: z.string().min(1),
  body: z.string().min(1, "Note is required"),
});

export type NoteInput = z.infer<typeof noteSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.enum(["Low", "Medium", "High", "Hot"]),
});

export type TaskInput = z.infer<typeof taskSchema>;
