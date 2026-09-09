import { FollowUpsView } from "@/components/follow-ups/follow-ups-view";
import { getFollowUps } from "@/lib/actions/activity";
import { getLeadOptions } from "@/lib/actions/leads";

export default async function FollowUpsPage() {
  const [followUps, leads] = await Promise.all([
    getFollowUps(),
    getLeadOptions(),
  ]);
  return <FollowUpsView followUps={followUps} leads={leads} />;
}
