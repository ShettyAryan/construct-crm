import { revalidatePath } from "next/cache";
import type { Client, Project, ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/auth";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";

function projectNames(client: Pick<Client, "company" | "projects">) {
  const names = [
    ...new Set(
      parseJsonArray(client.projects)
        .map((name) => name.trim())
        .filter(Boolean)
    ),
  ];
  return names.length > 0 ? names : [`${client.company} Engagement`];
}

async function currentActor() {
  try {
    const profile = await getCurrentProfile();
    if (profile) {
      return {
        name: profile.name,
        login: profile.loginId,
        profileId: profile.id,
      };
    }
  } catch {
    // Linking can run outside a signed-in request.
  }
  return { name: "Client track", login: "client-track", profileId: null };
}

function refreshWork(projectId?: string) {
  try {
    revalidatePath("/work");
    revalidatePath("/history");
    revalidatePath("/");
    if (projectId) revalidatePath(`/work/${projectId}`);
  } catch {
    // No request cache when this runs from a script.
  }
}

async function recordProjectChange(input: {
  action: "created" | "updated";
  project: Pick<Project, "id" | "name">;
  summary: string;
}) {
  const actor = await currentActor();
  await db.auditLog.create({
    data: {
      action: input.action,
      entityType: "Project",
      entityId: input.project.id,
      entityLabel: input.project.name,
      summary: input.summary,
      profileId: actor.profileId,
      actorName: actor.name,
      actorLogin: actor.login,
    },
  });
  refreshWork(input.project.id);
}

async function addTimeline(projectId: string, body: string) {
  const actor = await currentActor();
  await db.projectUpdate.create({
    data: {
      projectId,
      body,
      authorName: actor.name,
      authorLogin: actor.login,
    },
  });
}

/** Create any client-track project names that are not yet in Ongoing work. */
export async function ensureWorkProjectsForClient(
  client: Pick<Client, "id" | "company" | "projects">,
  status: ProjectStatus = "InProgress"
) {
  const names = projectNames(client);
  const existing = await db.project.findMany({
    where: { clientId: client.id },
    select: { name: true },
  });
  const have = new Set(existing.map((project) => project.name));

  for (const name of names) {
    if (have.has(name)) continue;
    const project = await db.project.create({
      data: {
        name,
        clientId: client.id,
        status,
      },
    });
    await addTimeline(project.id, `Project started for ${client.company}`);
    await recordProjectChange({
      action: "created",
      project,
      summary: `Started ${project.name} for ${client.company}`,
    });
  }
}

/** Link every ongoing client project into Ongoing work. */
export async function linkOngoingClientProjects() {
  const clients = await db.client.findMany({
    where: { workStatus: "Ongoing" },
    select: { id: true, company: true, projects: true },
  });

  for (const client of clients) {
    await ensureWorkProjectsForClient(client, "InProgress");
  }
}

/** Keep Ongoing work status in step with the client work track. */
export async function applyClientWorkStatus(
  client: Pick<Client, "id" | "company" | "projects">,
  workStatus: "Ongoing" | "Completed"
) {
  if (workStatus === "Ongoing") {
    await ensureWorkProjectsForClient(client, "InProgress");
    const finished = await db.project.findMany({
      where: { clientId: client.id, status: "Completed" },
    });
    for (const project of finished) {
      await db.project.update({
        where: { id: project.id },
        data: { status: "InProgress" },
      });
      await addTimeline(
        project.id,
        `Status changed to ${PROJECT_STATUS_LABELS.InProgress}`
      );
      await recordProjectChange({
        action: "updated",
        project,
        summary: `Reopened ${project.name} for ${client.company}`,
      });
    }
    return;
  }

  const active = await db.project.findMany({
    where: { clientId: client.id, status: { not: "Completed" } },
  });
  for (const project of active) {
    await db.project.update({
      where: { id: project.id },
      data: { status: "Completed" },
    });
    await addTimeline(
      project.id,
      `Status changed to ${PROJECT_STATUS_LABELS.Completed}`
    );
    await recordProjectChange({
      action: "updated",
      project,
      summary: `Completed ${project.name} for ${client.company}`,
    });
  }
}
