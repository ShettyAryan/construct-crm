import { notFound } from "next/navigation";
import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { getLead } from "@/lib/actions/leads";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  return <LeadDetailView lead={lead} />;
}
