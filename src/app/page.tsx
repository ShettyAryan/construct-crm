import Link from "next/link";
import { format } from "date-fns";
import {
  Bell,
  Flame,
  LayoutDashboard,
  Phone,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/badges";
import { getDashboardData } from "@/lib/actions/dashboard";
import { formatBudget } from "@/lib/constants";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Pipeline pulse for ConstructDev & ConstructXR"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads"
          value={data.totalLeads}
          icon={Users}
          hint="All pipeline leads"
        />
        <StatCard
          label="Hot leads"
          value={data.hotLeads}
          icon={Flame}
          hint="Open + Hot priority"
        />
        <StatCard
          label="Deals won"
          value={data.dealsWon}
          icon={Trophy}
          hint="Converted clients"
        />
        <StatCard
          label="Revenue pipeline"
          value={formatBudget(data.revenuePipeline)}
          icon={Wallet}
          hint="Open deal budgets"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Follow-ups due today"
          icon={Bell}
          href="/follow-ups"
        >
          {data.followUpsDueToday.length === 0 ? (
            <EmptyState
              title="Nothing due today"
              description="You're clear on follow-ups."
              className="border-0 py-8"
            />
          ) : (
            <ul className="divide-y">
              {data.followUpsDueToday.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">
                      {f.lead ? (
                        <Link
                          href={`/leads/${f.lead.id}`}
                          className="hover:underline"
                        >
                          {f.lead.company}
                        </Link>
                      ) : (
                        "General"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.time ? `${f.time} · ` : ""}
                      {f.reminder ?? "Follow-up"}
                    </p>
                  </div>
                  <PriorityBadge priority={f.priority} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming calls & follow-ups" icon={Phone} href="/calls">
          {data.upcomingFollowCallLeads.length === 0 &&
          data.upcomingCalls.length === 0 ? (
            <EmptyState
              title="No upcoming calls"
              className="border-0 py-8"
            />
          ) : (
            <ul className="divide-y">
              {data.upcomingFollowCallLeads.map((lead) => (
                <li key={lead.id} className="py-2.5">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {lead.company}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {lead.contact}
                    {lead.nextFollowUp
                      ? ` · ${format(lead.nextFollowUp, "MMM d, h:mm a")}`
                      : ""}
                  </p>
                </li>
              ))}
              {data.upcomingCalls.map((call) => (
                <li key={call.id} className="py-2.5">
                  <Link
                    href={`/leads/${call.leadId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {call.lead.company}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Logged call · {format(call.date, "MMM d")} · {call.summary}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" icon={LayoutDashboard} href="/leads">
          {data.recentActivity.length === 0 ? (
            <EmptyState title="No activity" className="border-0 py-8" />
          ) : (
            <ul className="divide-y">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/leads/${a.leadId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.lead.company}
                    </Link>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {format(a.createdAt, "MMM d")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.title}
                    {a.body ? ` — ${a.body}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Open tasks" icon={Users} href="/tasks">
          {data.pendingTasks.length === 0 ? (
            <EmptyState title="No open tasks" className="border-0 py-8" />
          ) : (
            <ul className="divide-y">
              {data.pendingTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.dueDate
                        ? `Due ${format(t.dueDate, "MMM d")}`
                        : "No due date"}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: typeof Bell;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border">
      <div className="mb-3 flex items-center justify-between gap-2 border-b px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-sm font-medium">{title}</h2>
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="px-3 py-1 sm:px-4">{children}</div>
    </section>
  );
}
