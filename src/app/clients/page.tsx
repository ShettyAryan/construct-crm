import { ClientsView } from "@/components/clients/clients-view";
import { getClients } from "@/lib/actions/clients";

export default async function ClientsPage() {
  const clients = await getClients();
  return <ClientsView clients={clients} />;
}
