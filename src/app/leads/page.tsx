import { PageHeader } from "@/components/shared/page-header";
import { LeadsView } from "@/components/leads/leads-view";
import { getLeads } from "@/lib/actions/leads";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    priority?: string;
    status?: string;
    agency?: string;
    open?: string;
  }>;
}) {
  const params = await searchParams;
  const leads = await getLeads();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Search and manage your sales pipeline"
      />
      <LeadsView
        leads={leads}
        initialAgency={params.agency ?? "all"}
        initialStatus={params.status ?? "all"}
        initialPriority={params.priority ?? "all"}
        initialOpenOnly={params.open === "1"}
      />
    </div>
  );
}
