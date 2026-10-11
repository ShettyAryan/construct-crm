import { ClientsView } from "@/components/clients/clients-view";
import { getClients } from "@/lib/actions/clients";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const clients = await getClients();
  return (
    <ClientsView
      clients={clients}
      initialFilter={params.filter === "outstanding" ? "outstanding" : "all"}
    />
  );
}
