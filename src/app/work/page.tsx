import { WorkList } from "@/components/work/work-list";
import {
  listManagers,
  listWorkClients,
  listWorkProjects,
} from "@/lib/actions/work";
import { isProjectStatus } from "@/lib/project-status";

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const [projects, clients, managers] = await Promise.all([
    listWorkProjects(client),
    listWorkClients(),
    listManagers(),
  ]);

  return (
    <WorkList
      clientId={client}
      clients={clients}
      managers={managers.map((manager) => ({
        id: manager.id,
        name: manager.name,
      }))}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: isProjectStatus(project.status) ? project.status : "NotStarted",
        updatedAt: project.updatedAt.toISOString(),
        client: project.client,
        managerName: project.manager?.name ?? null,
        lastUpdate: project.updates[0]?.body ?? null,
      }))}
    />
  );
}
