import { FollowUpsView } from "@/components/follow-ups/follow-ups-view";
import { getFollowUps } from "@/lib/actions/activity";

export default async function FollowUpsPage() {
  const followUps = await getFollowUps("all");
  return <FollowUpsView followUps={followUps} />;
}
