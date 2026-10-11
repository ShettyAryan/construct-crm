import { notFound } from "next/navigation";
import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { getLead } from "@/lib/actions/leads";
import { getRecordHistory } from "@/lib/actions/history";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, history] = await Promise.all([
    getLead(id),
    getRecordHistory("Lead", id),
  ]);
  if (!lead) notFound();
  return <LeadDetailView lead={lead} history={history} />;
}
