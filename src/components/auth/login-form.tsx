"use client";

import { useActionState } from "react";
import { loginFromForm } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function LoginForm({ showBootstrapHint }: { showBootstrapHint: boolean }) {
  const [state, action, pending] = useActionState(loginFromForm, {
    error: "",
  });

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="loginId">Login ID</Label>
        <Input
          id="loginId"
          name="loginId"
          autoComplete="username"
          autoCapitalize="none"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {showBootstrapHint ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          First sign-in: login ID{" "}
          <span className="font-medium text-foreground">admin</span>, password{" "}
          <span className="font-medium text-foreground">construct</span>. Change
          it after you sign in.
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
