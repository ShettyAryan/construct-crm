"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  ensureBootstrapAdmin,
  getCurrentProfile,
  newSessionExpiry,
  newSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { cookies } from "next/headers";

export async function loginFromForm(
  _prev: { error: string },
  formData: FormData
) {
  await ensureBootstrapAdmin();
  const loginId = String(formData.get("loginId") ?? "");
  const password = String(formData.get("password") ?? "");
  const id = loginId.trim().toLowerCase();
  const profile = await db.profile.findUnique({ where: { loginId: id } });

  if (!profile || !profile.active) {
    return { error: "Invalid login ID or password" };
  }

  const valid = await verifyPassword(password, profile.passwordHash);
  if (!valid) {
    return { error: "Invalid login ID or password" };
  }

  const token = newSessionToken();
  const expiresAt = newSessionExpiry();
  await db.$transaction([
    db.session.create({
      data: { token, profileId: profile.id, expiresAt },
    }),
    db.profile.update({
      where: { id: profile.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  await setSessionCookie(token, expiresAt);
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function changeOwnPassword(
  currentPassword: string,
  nextPassword: string
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in required");

  const next = nextPassword.trim();
  if (next.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const valid = await verifyPassword(currentPassword, profile.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  await db.profile.update({
    where: { id: profile.id },
    data: { passwordHash: await hashPassword(next) },
  });
}
