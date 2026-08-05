"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  Kanban,
  LayoutDashboard,
  Menu,
  Phone,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const icons = {
  LayoutDashboard,
  Users,
  Kanban,
  Phone,
  Calendar,
  Bell,
  Building2,
  CheckSquare,
} as const;

const nav = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/leads", label: "Leads", icon: "Users" as const },
  { href: "/pipeline", label: "Pipeline", icon: "Kanban" as const },
  { href: "/calls", label: "Calls", icon: "Phone" as const },
  { href: "/meetings", label: "Meetings", icon: "Calendar" as const },
  { href: "/follow-ups", label: "Follow-ups", icon: "Bell" as const },
  { href: "/clients", label: "Clients", icon: "Building2" as const },
  { href: "/tasks", label: "Tasks", icon: "CheckSquare" as const },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {nav.map((item) => {
        const Icon = icons[item.icon];
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
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

function Brand() {
  return (
    <div className="px-4 py-4">
      <Link href="/" className="block">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Construct
        </p>
        <p className="text-lg font-semibold tracking-tight">CRM</p>
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        Dev & XR pipeline
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Brand />
        <Separator />
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks />
        </div>
        <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-3">
          <span className="text-xs text-muted-foreground">Personal</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto py-3">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-3">
              <span className="text-xs text-muted-foreground">Personal</span>
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-sm font-semibold">Construct CRM</span>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
