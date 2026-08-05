import Link from "next/link";
import { format } from "date-fns";
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
import { getCalls } from "@/lib/actions/activity";

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <div>
      <PageHeader
        title="Calls"
        description="All logged calls across leads"
      />
      {calls.length === 0 ? (
        <EmptyState
          title="No calls yet"
          description="Log a call from any lead detail page."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
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
                    {format(call.date, "MMM d, yyyy")}
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
      )}
    </div>
  );
}
