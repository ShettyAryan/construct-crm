"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { AppSelect } from "@/components/shared/app-select";
import { ACCESS_AREAS, defaultAccess, type AccessMap } from "@/lib/access";
import {
  createProfile,
  updateProfile,
  type ProfileInput,
  type ProfileListItem,
} from "@/lib/actions/profiles";
import { formatISTDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const levelOptions = [
  { value: "none", label: "No access" },
  { value: "view", label: "View only" },
  { value: "edit", label: "Can edit" },
];

type Draft = ProfileInput & { id?: string };

function blankDraft(): Draft {
  return {
    name: "",
    loginId: "",
    password: "",
    isAdmin: false,
    active: true,
    access: defaultAccess(),
  };
}

export function ProfilesView({
  profiles,
  currentId,
}: {
  profiles: ProfileListItem[];
  currentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [saving, setSaving] = useState(false);

  const editing = Boolean(draft.id);

  function openCreate() {
    setDraft(blankDraft());
    setOpen(true);
  }

  function openEdit(profile: ProfileListItem) {
    setDraft({
      id: profile.id,
      name: profile.name,
      loginId: profile.loginId,
      password: "",
      isAdmin: profile.isAdmin,
      active: profile.active,
      access: profile.access,
    });
    setOpen(true);
  }

  async function onSave() {
    setSaving(true);
    try {
      if (draft.id) {
        await updateProfile(draft.id, draft);
        toast.success("Profile updated");
      } else {
        await createProfile(draft);
        toast.success("Profile created");
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Profiles"
        description="People who can sign in, and what each of them can change"
        actions={
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="size-4" />
            New profile
          </Button>
        }
      />

      <div className="grid gap-3">
        {profiles.map((profile) => (
          <article
            key={profile.id}
            className={cn(
              "rounded-lg border p-3 sm:p-4",
              !profile.active && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-medium">{profile.name}</h2>
                  {profile.id === currentId ? (
                    <span className="text-[11px] text-muted-foreground">You</span>
                  ) : null}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                    {profile.isAdmin ? "Admin" : "Member"}
                  </span>
                  {!profile.active ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                      Inactive
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Login ID {profile.loginId}
                  {profile.lastLoginAt
                    ? ` · Last sign-in ${formatISTDateTime(profile.lastLoginAt)} IST`
                    : " · Has not signed in"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(profile)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </div>
            <AccessSummary profile={profile} />
          </article>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit profile" : "New profile"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-login">Login ID</Label>
              <Input
                id="profile-login"
                autoCapitalize="none"
                value={draft.loginId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, loginId: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-password">
                {editing ? "New password" : "Password"}
              </Label>
              <PasswordInput
                id="profile-password"
                autoComplete="new-password"
                placeholder={editing ? "Leave blank to keep the current password" : ""}
                value={draft.password ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.isAdmin}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({ ...prev, isAdmin: Boolean(checked) }))
                }
              />
              Admin — can manage profiles and change everything
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.active}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({ ...prev, active: Boolean(checked) }))
                }
              />
              Active — can sign in
            </label>
            {draft.isAdmin ? (
              <p className="text-xs text-muted-foreground">
                Admins are not limited by the access list below.
              </p>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm font-medium">Access</p>
                {ACCESS_AREAS.map((area) => (
                  <div
                    key={area.key}
                    className="grid items-center gap-2 sm:grid-cols-[1fr_9rem]"
                  >
                    <div>
                      <p className="text-sm">{area.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.description}
                      </p>
                    </div>
                    <AppSelect
                      value={draft.access[area.key]}
                      onValueChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          access: {
                            ...prev.access,
                            [area.key]: value,
                          } as AccessMap,
                        }))
                      }
                      options={levelOptions}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
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

function AccessSummary({ profile }: { profile: ProfileListItem }) {
  const text = useMemo(() => {
    if (profile.isAdmin) return "Full access, including profiles";
    const editable = ACCESS_AREAS.filter(
      (area) => profile.access[area.key] === "edit"
    ).map((area) => area.label);
    const view = ACCESS_AREAS.filter(
      (area) => profile.access[area.key] === "view"
    ).map((area) => area.label);
    const parts = [];
    if (editable.length) parts.push(`Can edit ${editable.join(", ")}`);
    if (view.length) parts.push(`View only ${view.join(", ")}`);
    return parts.join(" · ") || "No CRM access";
  }, [profile]);

  return <p className="mt-3 text-xs text-muted-foreground">{text}</p>;
}
