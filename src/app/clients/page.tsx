import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AgencyBadge } from "@/components/shared/badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClients } from "@/lib/actions/clients";
import { formatBudget, parseJsonArray } from "@/lib/constants";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Won leads converted to client records"
      />
      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Move a lead to Won to create a client automatically."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const projects = parseJsonArray(client.projects);
                const services = parseJsonArray(client.services);
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/leads/${client.leadId}`}
                        className="font-medium hover:underline"
                      >
                        {client.company}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <AgencyBadge agency={client.lead.agency} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {projects.join(", ") || "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {services.join(", ") || "—"}
                    </TableCell>
                    <TableCell>{formatBudget(client.revenue)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
