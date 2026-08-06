import { TracksView } from "@/components/tracks/tracks-view";
import { getTracksData } from "@/lib/actions/clients";

export default async function TracksPage() {
  const data = await getTracksData();
  return (
    <TracksView
      activeLeads={data.activeLeads}
      ongoingClients={data.ongoingClients}
      completedClients={data.completedClients}
    />
  );
}
