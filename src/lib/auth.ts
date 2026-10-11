import { cache } from "react";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  canEdit,
  canView,
  canViewAny,
  parseAccess,
  type AccessArea,
} from "@/lib/access";
import type { SessionUser } from "@/lib/session-user";

export type { SessionUser };

export const SESSION_COOKIE = "crm_session";
export const SESSION_DAYS = 30;
export const BOOTSTRAP_LOGIN = "admin";
export const BOOTSTRAP_PASSWORD = "construct";

export function toSessionUser(profile: Profile): SessionUser {
  return {
    id: profile.id,
    name: profile.name,
    loginId: profile.loginId,
    isAdmin: profile.isAdmin,
    access: profile.isAdmin
      ? {
          leads: "edit",
          pipeline: "edit",
          calls: "edit",
          meetings: "edit",
          followUps: "edit",
          clients: "edit",
          tasks: "edit",
          tracks: "edit",
          work: "edit",
        }
      : parseAccess(profile.access),
  };
}

export async function setSessionCookie(token: string, expires: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function newSessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export const getCurrentProfile = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { profile: true },
  });

  if (!session || session.expiresAt < new Date() || !session.profile.active) {
    return null;
  }

  return session.profile;
});

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (!profile.isAdmin) redirect("/");
  return profile;
}

export async function requireView(area: AccessArea) {
  const profile = await requireProfile();
  if (!canView(profile, area)) redirect("/");
  return profile;
}

export async function requireAnyView(areas: AccessArea[]) {
  const profile = await requireProfile();
  if (!canViewAny(profile, areas)) redirect("/");
  return profile;
}

export async function requireEdit(area: AccessArea) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in required");
  if (!canEdit(profile, area)) {
    throw new Error("You don't have permission to change this");
  }
  return profile;
}

export async function ensureBootstrapAdmin() {
  const count = await db.profile.count();
  if (count > 0) return;

  await db.profile.create({
    data: {
      name: "Admin",
      loginId: BOOTSTRAP_LOGIN,
      passwordHash: await hashPassword(BOOTSTRAP_PASSWORD),
      isAdmin: true,
      active: true,
      access: "{}",
    },
  });
}

export async function shouldShowBootstrapHint() {
  const profiles = await db.profile.findMany({
    select: { loginId: true, lastLoginAt: true },
  });
  return (
    profiles.length === 1 &&
    profiles[0].loginId === BOOTSTRAP_LOGIN &&
    !profiles[0].lastLoginAt
  );
}
