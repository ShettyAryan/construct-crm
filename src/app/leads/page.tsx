import { PageHeader } from "@/components/shared/page-header";
import { LeadsView } from "@/components/leads/leads-view";
import { getLeads } from "@/lib/actions/leads";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Search and manage your sales pipeline"
      />
      <LeadsView leads={leads} />
    </div>
  );
}
