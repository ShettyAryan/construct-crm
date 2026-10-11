import Link from "next/link";
import { Building2, FolderKanban } from "lucide-react";
import { getCurrentProfile, toSessionUser } from "@/lib/auth";

export default async function StartPage() {
  const profile = await getCurrentProfile();
  const user = profile ? toSessionUser(profile) : null;
  const canWork =
    !!user && (user.isAdmin || user.access.work === "view" || user.access.work === "edit");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col justify-center py-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {user ? `Welcome, ${user.name}` : "Choose a workspace"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Client track is the sales CRM. Ongoing work follows the projects for those clients.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/"
          className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40"
        >
          <Building2 className="size-5 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Client track</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leads, pipeline, calls, payments, and the existing client records.
          </p>
        </Link>

        {canWork ? (
          <Link
            href="/work"
            className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <FolderKanban className="size-5 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Ongoing work</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Who is managing each client project, its status, updates, and timeline.
            </p>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed p-5 opacity-70">
            <FolderKanban className="size-5 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Ongoing work</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your profile does not have access to ongoing work.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
