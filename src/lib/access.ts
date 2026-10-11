export const ACCESS_AREAS = [
  {
    key: "leads",
    label: "Leads",
    description: "Create and edit lead records",
  },
  {
    key: "pipeline",
    label: "Pipeline",
    description: "Move deals between stages",
  },
  {
    key: "calls",
    label: "Calls",
    description: "Log calls",
  },
  {
    key: "meetings",
    label: "Meetings",
    description: "Log meetings",
  },
  {
    key: "followUps",
    label: "Follow-ups",
    description: "Schedule and complete follow-ups",
  },
  {
    key: "clients",
    label: "Clients",
    description: "Payments and work status",
  },
  {
    key: "tasks",
    label: "Tasks",
    description: "Personal task list",
  },
  {
    key: "tracks",
    label: "Tracks",
    description: "Active, ongoing, and completed work",
  },
] as const;

export type AccessArea = (typeof ACCESS_AREAS)[number]["key"];
export type AccessLevel = "none" | "view" | "edit";
export type AccessMap = Record<AccessArea, AccessLevel>;

export function defaultAccess(): AccessMap {
  return {
    leads: "edit",
    pipeline: "edit",
    calls: "edit",
    meetings: "edit",
    followUps: "edit",
    clients: "edit",
    tasks: "edit",
    tracks: "edit",
  };
}

export function parseAccess(raw: string | null | undefined): AccessMap {
  const access = defaultAccess();
  if (!raw) return access;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const area of ACCESS_AREAS) {
      const value = parsed[area.key];
      if (value === "none" || value === "view" || value === "edit") {
        access[area.key] = value;
      }
    }
  } catch {
    return access;
  }
  return access;
}

export function serializeAccess(access: AccessMap) {
  return JSON.stringify(access);
}

type AccessProfile = { isAdmin: boolean; access: string };

export function canView(profile: AccessProfile, area: AccessArea) {
  if (profile.isAdmin) return true;
  const level = parseAccess(profile.access)[area];
  return level === "view" || level === "edit";
}

export function canEdit(profile: AccessProfile, area: AccessArea) {
  if (profile.isAdmin) return true;
  return parseAccess(profile.access)[area] === "edit";
}

export function canViewAny(profile: AccessProfile, areas: AccessArea[]) {
  return areas.some((area) => canView(profile, area));
}
