import { notFound } from "next/navigation";
import { WorkDetailView } from "@/components/work/work-detail";
import { getWorkProject, listManagers } from "@/lib/actions/work";
import { isProjectStatus } from "@/lib/project-status";

export default async function WorkProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, managers] = await Promise.all([
    getWorkProject(id),
    listManagers(),
  ]);
  if (!project) notFound();

  return (
    <WorkDetailView
      managers={managers.map((manager) => ({
        id: manager.id,
        name: manager.name,
      }))}
      project={{
        id: project.id,
        name: project.name,
        status: isProjectStatus(project.status) ? project.status : "NotStarted",
        summary: project.summary,
        client: {
          id: project.client.id,
          company: project.client.company,
          leadId: project.client.leadId,
        },
        managerId: project.managerId,
        deadline: project.deadline?.toISOString() ?? null,
        progress: project.progress,
        updates: project.updates.map((update) => ({
          id: update.id,
          body: update.body,
          authorName: update.authorName,
          authorLogin: update.authorLogin,
          createdAt: update.createdAt.toISOString(),
        })),
      }}
    />
  );
}
