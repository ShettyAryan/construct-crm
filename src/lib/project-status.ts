export const PROJECT_STATUSES = [
  "NotStarted",
  "InProgress",
  "OnHold",
  "InReview",
  "Completed",
] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  NotStarted: "Not started",
  InProgress: "In progress",
  OnHold: "On hold",
  InReview: "In review",
  Completed: "Completed",
};

export function isProjectStatus(value: string): value is ProjectStatusValue {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}
