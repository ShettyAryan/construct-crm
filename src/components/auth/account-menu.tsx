"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { changeOwnPassword, logout } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/session-user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await changeOwnPassword(currentPassword, nextPassword);
      toast.success("Password updated");
      setOpen(false);
      setCurrentPassword("");
      setNextPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update password"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border px-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.loginId}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button variant="outline" size="xs" onClick={() => setOpen(true)}>
            Password
          </Button>
          <form action={logout}>
            <Button variant="ghost" size="xs" type="submit">
              <LogOut className="size-3" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
      <ThemeToggle />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="next-password">New password</Label>
              <PasswordInput
                id="next-password"
                autoComplete="new-password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
