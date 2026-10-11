import Link from "next/link";
import { ExternalLink, Phone, StickyNote, Bell, Calendar, UserRound } from "lucide-react";
import type {
  Activity,
  Call,
  Client,
  FollowUp,
  Lead,
  Meeting,
  Note,
  Poc,
} from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import {
  AgencyBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/shared/badges";
import { formatBudget, parseJsonArray } from "@/lib/constants";
import { formatISTDate, formatISTDateTime, formatISTShort } from "@/lib/datetime";
import { formatPocName } from "@/lib/poc";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";
import { Timeline } from "@/components/activity/timeline";
import type { HistoryEntry } from "@/lib/actions/history";

type LeadDetail = Lead & {
  pocs: Poc[];
  calls: Call[];
  meetings: Meeting[];
  followUps: FollowUp[];
  notesList: Note[];
  activities: Activity[];
  client: Client | null;
};

export function LeadDetailView({
  lead,
  history = [],
}: {
  lead: LeadDetail;
  history?: HistoryEntry[];
}) {
  const services = parseJsonArray(lead.services);
  const primaryName = formatPocName(lead.pocs);

  return (
    <div>
      <PageHeader
        title={lead.company}
        description={`${primaryName}${lead.city ? ` · ${lead.city}` : ""}`}
        actions={<LeadDetailActions lead={lead} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AgencyBadge agency={lead.agency} />
        <StatusBadge status={lead.status} />
        <PriorityBadge priority={lead.priority} />
        {history[0] ? (
          <span className="text-xs text-muted-foreground">
            Last change by {history[0].actorName} ·{" "}
            {formatISTDateTime(history[0].createdAt)} IST
          </span>
        ) : null}
        {lead.client ? (
          <Link
            href="/clients"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            View client record
          </Link>
        ) : null}
      </div>

      {lead.client ? (
        <section className="mb-6 rounded-lg border p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Payment</h2>
            <Link
              href="/clients"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Update on Clients
            </Link>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Amount agreed</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatBudget(lead.client.amountAgreed)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Amount collected</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatBudget(lead.client.amountCollected)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Outstanding</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatBudget(
                  Math.max(
                    0,
                    lead.client.amountAgreed - lead.client.amountCollected
                  )
                )}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-lg border p-3 sm:p-4">
            <h2 className="mb-3 text-sm font-medium">Company details</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail
                label="Website"
                value={
                  lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      {lead.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null
                }
              />
              <Detail
                label="LinkedIn"
                value={
                  lead.linkedin ? (
                    <a
                      href={lead.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Profile
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null
                }
              />
              <Detail label="Industry" value={lead.industry} />
              <Detail label="Source" value={lead.source} />
              <Detail label="Budget" value={formatBudget(lead.budget)} />
              <Detail
                label="Next follow-up"
                value={
                  lead.nextFollowUp
                    ? formatISTDate(lead.nextFollowUp)
                    : null
                }
              />
              <div className="sm:col-span-2">
                <Detail
                  label="Services"
                  value={services.length ? services.join(", ") : null}
                />
              </div>
            </dl>
          </section>

          <section className="rounded-lg border p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <UserRound className="size-3.5 text-muted-foreground" />
              <h2 className="text-sm font-medium">Points of contact</h2>
            </div>
            {lead.pocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No POCs added</p>
            ) : (
              <ul className="space-y-4">
                {lead.pocs.map((poc) => (
                  <li key={poc.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{poc.name}</p>
                        {poc.role ? (
                          <p className="text-xs text-muted-foreground">{poc.role}</p>
                        ) : null}
                      </div>
                      {poc.isPrimary ? (
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          Primary
                        </span>
                      ) : null}
                    </div>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Detail label="Email" value={poc.email} />
                      <Detail label="Phone" value={poc.phone} />
                      <div className="sm:col-span-2">
                        <Detail
                          label="LinkedIn"
                          value={
                            poc.linkedin ? (
                              <a
                                href={poc.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:underline"
                              >
                                Profile
                                <ExternalLink className="size-3" />
                              </a>
                            ) : null
                          }
                        />
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium">Timeline</h2>
            <Timeline activities={lead.activities} />
          </section>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <SideBlock
            title="Calls"
            icon={Phone}
            empty="No calls logged"
            items={lead.calls.map((c) => ({
              id: c.id,
              title: formatISTShort(c.date),
              body: c.summary,
            }))}
          />
          <SideBlock
            title="Meetings"
            icon={Calendar}
            empty="No meetings"
            items={lead.meetings.map((m) => ({
              id: m.id,
              title: formatISTShort(m.date),
              body: m.summary,
            }))}
          />
          <SideBlock
            title="Follow-ups"
            icon={Bell}
            empty="No follow-ups"
            items={lead.followUps.map((f) => ({
              id: f.id,
              title: `${formatISTShort(f.date)}${f.time ? ` · ${f.time}` : ""}`,
              body: f.reminder ?? "Follow-up",
            }))}
          />
          <SideBlock
            title="Notes"
            icon={StickyNote}
            empty="No notes"
            items={lead.notesList.map((n) => ({
              id: n.id,
              title: formatISTShort(n.createdAt),
              body: n.body,
            }))}
          />
        </aside>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || "—"}</dd>
    </div>
  );
}

function SideBlock({
  title,
  icon: Icon,
  empty,
  items,
}: {
  title: string;
  icon: typeof Phone;
  empty: string;
  items: { id: string; title: string; body: string }[];
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <p className="text-xs font-medium text-muted-foreground">
                {item.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
