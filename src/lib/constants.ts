import type { Agency, LeadStatus, Priority, WorkStatus } from "@prisma/client";

export const AGENCIES: Agency[] = ["ConstructDev", "ConstructXR"];

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Qualified",
  "Discovery",
  "ProposalSent",
  "Negotiation",
  "Won",
  "Lost",
];

export const PIPELINE_STATUSES: LeadStatus[] = LEAD_STATUSES;

export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Hot"];

export const WORK_STATUSES: WorkStatus[] = ["Ongoing", "Completed"];

export const SERVICE_OPTIONS = [
  "Web Development",
  "Mobile App",
  "UI/UX Design",
  "XR / VR Experience",
  "AR Product Demo",
  "Consulting",
  "Maintenance",
  "Branding",
] as const;

export const LEAD_SOURCES = [
  "Referral",
  "LinkedIn",
  "Website",
  "Cold Outreach",
  "Conference",
  "Partner",
  "Other",
] as const;

export const STATUS_LABELS: Record<LeadStatus, string> = {
  New: "New",
  Qualified: "Qualified",
  Discovery: "Discovery",
  ProposalSent: "Proposal Sent",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Hot: "Hot",
};

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  Ongoing: "Ongoing",
  Completed: "Completed",
};

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/leads", label: "Leads", icon: "Users" },
  { href: "/pipeline", label: "Pipeline", icon: "Kanban" },
  { href: "/calls", label: "Calls", icon: "Phone" },
  { href: "/meetings", label: "Meetings", icon: "Calendar" },
  { href: "/follow-ups", label: "Follow-ups", icon: "Bell" },
  { href: "/clients", label: "Clients", icon: "Building2" },
  { href: "/tasks", label: "Tasks", icon: "CheckSquare" },
] as const;

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toJsonArray(value: string[]): string {
  return JSON.stringify(value);
}

export function formatBudget(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
