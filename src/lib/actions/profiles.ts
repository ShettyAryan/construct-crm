"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { recordChange } from "@/lib/audit";
import {
  defaultAccess,
  parseAccess,
  serializeAccess,
  type AccessMap,
} from "@/lib/access";
import { getCurrentProfile, requireAdmin } from "@/lib/auth";

const loginIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9._-]{2,31}$/,
    "Login ID must be 3–32 characters: letters, numbers, dots, hyphens"
  );

const accessLevel = z.enum(["none", "view", "edit"]);

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  loginId: loginIdSchema,
  password: z.string().optional(),
  isAdmin: z.boolean(),
  active: z.boolean(),
  access: z.object({
    leads: accessLevel,
    pipeline: accessLevel,
    calls: accessLevel,
    meetings: accessLevel,
    followUps: accessLevel,
    clients: accessLevel,
    tasks: accessLevel,
    tracks: accessLevel,
  }),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type ProfileListItem = {
  id: string;
  name: string;
  loginId: string;
  active: boolean;
  isAdmin: boolean;
  access: AccessMap;
  lastLoginAt: string | null;
  createdAt: string;
};

function revalidateProfiles() {
  revalidatePath("/profiles");
  revalidatePath("/");
}

async function assertAdminRemains(
  profileId: string,
  next: { isAdmin: boolean; active: boolean }
) {
  const current = await db.profile.findUnique({ where: { id: profileId } });
  if (!current) throw new Error("Profile not found");

  const removingAdmin =
    current.isAdmin && current.active && (!next.isAdmin || !next.active);
  if (!removingAdmin) return current;

  const others = await db.profile.count({
    where: { isAdmin: true, active: true, id: { not: profileId } },
  });
  if (others === 0) {
    throw new Error("Keep at least one active admin profile");
  }

  const me = await getCurrentProfile();
  if (me?.id === profileId && !next.active) {
    throw new Error("Another admin has to deactivate your profile");
  }

  return current;
}

export async function listProfiles(): Promise<ProfileListItem[]> {
  await requireAdmin();
  const profiles = await db.profile.findMany({
    orderBy: [{ isAdmin: "desc" }, { name: "asc" }],
  });
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    loginId: profile.loginId,
    active: profile.active,
    isAdmin: profile.isAdmin,
    access: profile.isAdmin ? defaultAccess() : parseAccess(profile.access),
    lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
  }));
}

export async function createProfile(raw: ProfileInput) {
  await requireAdmin();
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Check the profile details");
  }
  const data = parsed.data;
  const password = data.password?.trim() ?? "";
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const existing = await db.profile.findUnique({
    where: { loginId: data.loginId },
  });
  if (existing) throw new Error("That login ID is already in use");

  const profile = await db.profile.create({
    data: {
      name: data.name,
      loginId: data.loginId,
      passwordHash: await hashPassword(password),
      isAdmin: data.isAdmin,
      active: data.active,
      access: data.isAdmin ? "{}" : serializeAccess(data.access),
    },
  });

  await recordChange({
    action: "created",
    entityType: "Profile",
    entityId: profile.id,
    entityLabel: profile.name,
    summary: `Created profile ${profile.name} (${profile.loginId})`,
  });
  revalidateProfiles();
  return { id: profile.id };
}

export async function updateProfile(id: string, raw: ProfileInput) {
  await requireAdmin();
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Check the profile details");
  }
  const data = parsed.data;
  const current = await assertAdminRemains(id, {
    isAdmin: data.isAdmin,
    active: data.active,
  });

  const loginTaken = await db.profile.findFirst({
    where: { loginId: data.loginId, id: { not: id } },
  });
  if (loginTaken) throw new Error("That login ID is already in use");

  const password = data.password?.trim() ?? "";
  if (password && password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const profile = await db.profile.update({
    where: { id },
    data: {
      name: data.name,
      loginId: data.loginId,
      isAdmin: data.isAdmin,
      active: data.active,
      access: data.isAdmin ? "{}" : serializeAccess(data.access),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  if (!profile.active) {
    await db.session.deleteMany({ where: { profileId: id } });
  }

  const changes: string[] = [];
  if (current.name !== profile.name) changes.push("name");
  if (current.loginId !== profile.loginId) changes.push("login ID");
  if (current.isAdmin !== profile.isAdmin) {
    changes.push(profile.isAdmin ? "made admin" : "removed admin");
  }
  if (current.active !== profile.active) {
    changes.push(profile.active ? "reactivated" : "deactivated");
  }
  if (password) changes.push("password");
  if (!profile.isAdmin && current.access !== profile.access) {
    changes.push("access");
  }

  await recordChange({
    action: "updated",
    entityType: "Profile",
    entityId: profile.id,
    entityLabel: profile.name,
    summary: `Updated profile ${profile.name}${
      changes.length ? `: ${changes.join(", ")}` : ""
    }`,
  });
  revalidateProfiles();
}
