import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  ensureBootstrapAdmin,
  getCurrentProfile,
  shouldShowBootstrapHint,
} from "@/lib/auth";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/start");

  await ensureBootstrapAdmin();
  const showBootstrapHint = await shouldShowBootstrapHint();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Construct
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your profile to continue.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <LoginForm showBootstrapHint={showBootstrapHint} />
        </div>
      </div>
    </div>
  );
}
