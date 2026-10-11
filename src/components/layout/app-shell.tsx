"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  History,
  Kanban,
  LayoutDashboard,
  Menu,
  Phone,
  Route,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccessProvider } from "@/components/auth/access-context";
import { AccountMenu } from "@/components/auth/account-menu";
import type { AccessArea } from "@/lib/access";
import type { SessionUser } from "@/lib/session-user";

const icons = {
  LayoutDashboard,
  Users,
  Kanban,
  Route,
  Phone,
  Calendar,
  Bell,
  Building2,
  CheckSquare,
  History,
  Shield,
  Briefcase,
} as const;

const clientNav = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" as const, area: null, admin: false },
  { href: "/leads", label: "Leads", icon: "Users" as const, area: "leads" as const, admin: false },
  { href: "/pipeline", label: "Pipeline", icon: "Kanban" as const, area: "pipeline" as const, admin: false },
  { href: "/tracks", label: "Tracks", icon: "Route" as const, area: "tracks" as const, admin: false },
  { href: "/calls", label: "Calls", icon: "Phone" as const, area: "calls" as const, admin: false },
  { href: "/meetings", label: "Meetings", icon: "Calendar" as const, area: "meetings" as const, admin: false },
  { href: "/follow-ups", label: "Follow-ups", icon: "Bell" as const, area: "followUps" as const, admin: false },
  { href: "/clients", label: "Clients", icon: "Building2" as const, area: "clients" as const, admin: false },
  { href: "/tasks", label: "Tasks", icon: "CheckSquare" as const, area: "tasks" as const, admin: false },
  { href: "/history", label: "History", icon: "History" as const, area: null, admin: false },
  { href: "/profiles", label: "Profiles", icon: "Shield" as const, area: null, admin: true },
];

const workNav = [
  { href: "/work", label: "Calendar", icon: "Calendar" as const, area: "work" as const, admin: false },
  { href: "/history", label: "History", icon: "History" as const, area: null, admin: false },
  { href: "/profiles", label: "Profiles", icon: "Shield" as const, area: null, admin: true },
];

function canOpen(user: SessionUser, area: AccessArea | null, admin?: boolean) {
  if (admin && !user.isAdmin) return false;
  if (!area || user.isAdmin) return true;
  return user.access[area] === "view" || user.access[area] === "edit";
}

const bottomNav = [
  { href: "/", label: "Home", icon: LayoutDashboard, area: null },
  { href: "/leads", label: "Leads", icon: Users, area: "leads" as const },
  { href: "/tracks", label: "Tracks", icon: Route, area: "tracks" as const },
  { href: "/follow-ups", label: "Follow-ups", icon: Bell, area: "followUps" as const },
];

function WorkspaceSwitch({ mode }: { mode: "client" | "work" | "start" }) {
  return (
    <div className="mx-2 mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted/70 p-1">
      <Link
        href="/"
        className={cn(
          "rounded-md px-2 py-1.5 text-center text-xs",
          mode === "client"
            ? "bg-background font-medium text-foreground shadow-sm"
            : "text-muted-foreground"
        )}
      >
        Client track
      </Link>
      <Link
        href="/work"
        className={cn(
          "rounded-md px-2 py-1.5 text-center text-xs",
          mode === "work"
            ? "bg-background font-medium text-foreground shadow-sm"
            : "text-muted-foreground"
        )}
      >
        Ongoing work
      </Link>
    </div>
  );
}

function NavLinks({
  user,
  inWork,
  onNavigate,
}: {
  user: SessionUser;
  inWork: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = (inWork ? workNav : clientNav).filter((item) =>
    canOpen(user, item.area, item.admin)
  );

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active =
          item.href === "/"
            ? pathname === "/"
            : item.href === "/work"
              ? pathname === "/work" || pathname.startsWith("/work/")
              : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ mode }: { mode: "client" | "work" | "start" }) {
  return (
    <div className="px-4 py-4">
      <Link
        href={mode === "work" ? "/work" : mode === "start" ? "/start" : "/"}
        className="block"
      >
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Construct
        </p>
        <p className="text-lg font-semibold tracking-tight">CRM</p>
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "work"
          ? "Ongoing work"
          : mode === "start"
            ? "Choose a workspace"
            : "Client track"}
      </p>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const inWork = pathname === "/work" || pathname.startsWith("/work/");
  const mode = pathname === "/start" ? "start" : inWork ? "work" : "client";
  const bottomItems = (inWork
    ? [{ href: "/work", label: "Calendar", icon: Calendar, area: "work" as const }]
    : bottomNav
  ).filter((item) => canOpen(user, item.area));

  return (
    <AccessProvider user={user}>
    <div className="flex min-h-dvh min-h-screen bg-background">
      {/* Desktop / large tablet sidebar */}
      <aside className="sticky top-0 hidden h-dvh h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand mode={mode} />
        <Separator />
        <div className="flex-1 overflow-y-auto py-3">
          <WorkspaceSwitch mode={mode} />
          <NavLinks user={user} inWork={inWork} />
        </div>
        <AccountMenu user={user} />
      </aside>

      {/* Mobile / tablet drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand mode={mode} />
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto py-3">
              <WorkspaceSwitch mode={mode} />
              <NavLinks user={user} inWork={inWork} onNavigate={() => setOpen(false)} />
            </div>
            <div className="pb-[env(safe-area-inset-bottom)]">
              <AccountMenu user={user} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-4 lg:hidden pt-[env(safe-area-inset-top)]">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
          <span className="truncate text-sm font-semibold">
            {mode === "start" ? "Construct CRM" : inWork ? "Ongoing work" : "Client track"}
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 pb-24 sm:px-5 sm:py-6 md:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>

        {/* Mobile / tablet bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)]">
          <div
            className="mx-auto grid max-w-[1400px]"
            style={{ gridTemplateColumns: `repeat(${bottomItems.length + 1}, minmax(0, 1fr))` }}
          >
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] sm:text-xs",
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-4 sm:size-[18px]" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-muted-foreground sm:text-xs"
            >
              <Menu className="size-4 sm:size-[18px]" />
              <span>More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
    </AccessProvider>
  );
}
