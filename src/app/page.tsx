import Link from "next/link";
import {
  Banknote,
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
import { formatISTDateTime, formatISTShort } from "@/lib/datetime";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Pipeline pulse for ConstructDev & ConstructXR · Times in IST"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads"
          value={data.totalLeads}
          icon={Users}
          hint="View all pipeline leads"
          href="/leads"
        />
        <StatCard
          label="Hot leads"
          value={data.hotLeads}
          icon={Flame}
          hint="Open deals with Hot priority"
          href="/leads?priority=Hot&open=1"
        />
        <StatCard
          label="Deals won"
          value={data.dealsWon}
          icon={Trophy}
          hint="Converted clients"
          href="/clients"
        />
        <StatCard
          label="Revenue pipeline"
          value={formatBudget(data.revenuePipeline)}
          icon={Wallet}
          hint="Open deal budgets on Pipeline"
          href="/pipeline"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Amount agreed"
          value={formatBudget(data.amountAgreed)}
          icon={Banknote}
          hint="Total deal value on Clients"
          href="/clients"
        />
        <StatCard
          label="Amount collected"
          value={formatBudget(data.amountCollected)}
          icon={Wallet}
          hint="Payments received so far"
          href="/clients"
        />
        <StatCard
          label="Outstanding"
          value={formatBudget(data.amountOutstanding)}
          icon={Trophy}
          hint="Clients with unpaid balance"
          href="/clients?filter=outstanding"
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

        <Panel title="Upcoming follow-ups" icon={Phone} href="/follow-ups">
          {data.upcomingFollowUps.length === 0 ? (
            <EmptyState
              title="No upcoming follow-ups"
              description="Nothing scheduled in the next 7 days."
              className="border-0 py-8"
            />
          ) : (
            <ul className="divide-y">
              {data.upcomingFollowUps.map((f) => (
                <li key={f.id} className="py-2.5">
                  {f.lead ? (
                    <Link
                      href={`/leads/${f.lead.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {f.lead.company}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">General</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatISTDateTime(f.date)}
                    {f.time ? ` · ${f.time}` : ""}
                    {f.reminder ? ` · ${f.reminder}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent changes" icon={LayoutDashboard} href="/history">
          {data.recentChanges.length === 0 ? (
            <EmptyState title="No changes yet" className="border-0 py-8" />
          ) : (
            <ul className="divide-y">
              {data.recentChanges.map((change) => (
                <li key={change.id} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    {change.entityType === "Lead" && change.entityId ? (
                      <Link
                        href={`/leads/${change.entityId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {change.summary}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{change.summary}</p>
                    )}
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatISTShort(change.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {change.actorName} · {formatISTDateTime(change.createdAt)} IST
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
                    <Link
                      href="/tasks"
                      className="text-sm font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t.dueDate
                        ? `Due ${formatISTShort(t.dueDate)}`
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
