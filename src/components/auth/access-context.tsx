"use client";

import { createContext, useContext } from "react";
import type { AccessArea } from "@/lib/access";
import type { SessionUser } from "@/lib/session-user";

const AccessContext = createContext<SessionUser | null>(null);

export function AccessProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <AccessContext.Provider value={user}>{children}</AccessContext.Provider>
  );
}

export function useSessionUser() {
  const user = useContext(AccessContext);
  if (!user) throw new Error("Signed-in profile is missing");
  return user;
}

export function useCanEdit(area: AccessArea) {
  const user = useSessionUser();
  return user.isAdmin || user.access[area] === "edit";
}
