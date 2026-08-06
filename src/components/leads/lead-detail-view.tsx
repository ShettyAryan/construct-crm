import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import type {
  Activity,
  Call,
  Client,
  FollowUp,
  Lead,
  Meeting,
  Note,
} from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import {
  AgencyBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/shared/badges";
import { formatBudget, parseJsonArray } from "@/lib/constants";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";
import { Timeline } from "@/components/activity/timeline";
import { Phone, StickyNote, Bell, Calendar } from "lucide-react";

type LeadDetail = Lead & {
  calls: Call[];
  meetings: Meeting[];
  followUps: FollowUp[];
  notesList: Note[];
  activities: Activity[];
  client: Client | null;
};

export function LeadDetailView({ lead }: { lead: LeadDetail }) {
  const services = parseJsonArray(lead.services);

  return (
    <div>
      <PageHeader
        title={lead.company}
        description={`${lead.contact}${lead.city ? ` · ${lead.city}` : ""}`}
        actions={<LeadDetailActions lead={lead} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AgencyBadge agency={lead.agency} />
        <StatusBadge status={lead.status} />
        <PriorityBadge priority={lead.priority} />
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
              <Detail label="Email" value={lead.email} />
              <Detail label="Phone" value={lead.phone} />
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
                    ? format(lead.nextFollowUp, "MMM d, yyyy")
                    : null
                }
              />
              <div className="sm:col-span-2">
                <Detail
                  label="Services"
                  value={services.length ? services.join(", ") : null}
                />
              </div>
              {lead.notes ? (
                <div className="sm:col-span-2">
                  <Detail label="Notes" value={lead.notes} />
                </div>
              ) : null}
            </dl>
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
              title: format(c.date, "MMM d"),
              body: c.summary,
            }))}
          />
          <SideBlock
            title="Meetings"
            icon={Calendar}
            empty="No meetings"
            items={lead.meetings.map((m) => ({
              id: m.id,
              title: format(m.date, "MMM d"),
              body: m.summary,
            }))}
          />
          <SideBlock
            title="Follow-ups"
            icon={Bell}
            empty="No follow-ups"
            items={lead.followUps.map((f) => ({
              id: f.id,
              title: `${format(f.date, "MMM d")}${f.time ? ` · ${f.time}` : ""}${f.completed ? " ✓" : ""}`,
              body: f.reminder ?? "Follow-up",
            }))}
          />
          <SideBlock
            title="Notes"
            icon={StickyNote}
            empty="No notes"
            items={lead.notesList.map((n) => ({
              id: n.id,
              title: format(n.createdAt, "MMM d"),
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
