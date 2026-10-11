import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile, toSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignedInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <AppShell user={toSessionUser(profile)}>{children}</AppShell>;
}
