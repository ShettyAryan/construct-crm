import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatISTDate, formatISTShort } from "@/lib/datetime";
import { getCalls } from "@/lib/actions/activity";

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <div>
      <PageHeader
        title="Calls"
        description="All logged calls across leads · Times in IST"
      />
      {calls.length === 0 ? (
        <EmptyState
          title="No calls yet"
          description="Log a call from any lead detail page."
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {calls.map((call) => (
              <Link
                key={call.id}
                href={`/leads/${call.leadId}`}
                className="rounded-lg border bg-card p-3.5 active:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{call.lead.company}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatISTShort(call.date)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {call.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{call.durationMin ? `${call.durationMin} min` : "—"}</span>
                  {call.outcome ? <span>{call.outcome}</span> : null}
                  {call.nextAction ? <span>Next: {call.nextAction}</span> : null}
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date (IST)</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Next action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatISTDate(call.date)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/leads/${call.leadId}`}
                        className="font-medium hover:underline"
                      >
                        {call.lead.company}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {call.durationMin ? `${call.durationMin} min` : "—"}
                    </TableCell>
                    <TableCell>{call.outcome ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{call.summary}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {call.nextAction ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
