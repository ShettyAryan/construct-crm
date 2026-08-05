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
import { getMeetings } from "@/lib/actions/activity";

export default async function MeetingsPage() {
  const meetings = await getMeetings();

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Discovery notes and next steps"
      />
      {meetings.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          description="Log a meeting from any lead detail page."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Pain points</TableHead>
                <TableHead>Next steps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(m.date, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/leads/${m.leadId}`}
                      className="font-medium hover:underline"
                    >
                      {m.lead.company}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{m.summary}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {m.painPoints ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {m.nextSteps ?? "—"}
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
