import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { getLeads } from "@/lib/actions/leads";

export default async function PipelinePage() {
  const leads = await getLeads();

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag cards to update deal stage"
      />
      <KanbanBoard leads={leads} />
    </div>
  );
}
