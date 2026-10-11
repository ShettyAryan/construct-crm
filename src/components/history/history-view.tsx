"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/shared/app-select";
import { formatISTDateTime } from "@/lib/datetime";
import type { HistoryEntry } from "@/lib/actions/history";

export function HistoryView({ entries }: { entries: HistoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState("all");
  const [entity, setEntity] = useState("all");

  const actors = useMemo(() => {
    const names = new Map<string, string>();
    for (const entry of entries) {
      names.set(entry.actorLogin, entry.actorName);
    }
    return [...names.entries()].map(([login, name]) => ({
      value: login,
      label: name,
    }));
  }, [entries]);

  const entities = useMemo(() => {
    return [...new Set(entries.map((entry) => entry.entityType))];
  }, [entries]);

  const filtered = entries.filter((entry) => {
    if (actor !== "all" && entry.actorLogin !== actor) return false;
    if (entity !== "all" && entry.entityType !== entity) return false;
    if (!query.trim()) return true;
    const haystack = `${entry.summary} ${entry.entityLabel} ${entry.actorName} ${entry.actorLogin}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="History"
        description="Who changed a record, and when · Times in IST"
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search changes"
        />
        <AppSelect
          value={actor}
          onValueChange={setActor}
          options={[{ value: "all", label: "Everyone" }, ...actors]}
        />
        <AppSelect
          value={entity}
          onValueChange={setEntity}
          options={[
            { value: "all", label: "All records" },
            ...entities.map((item) => ({ value: item, label: item })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No changes yet"
          description="Edits to leads, clients, tasks, and profiles will show up here."
        />
      ) : (
        <ol className="divide-y rounded-lg border">
          {filtered.map((entry) => {
            const leadHref =
              entry.entityType === "Lead" && entry.entityId
                ? `/leads/${entry.entityId}`
                : entry.entityType === "Client"
                  ? "/clients"
                  : entry.entityType === "Task"
                    ? "/tasks"
                    : entry.entityType === "Profile"
                      ? "/profiles"
                      : null;
            return (
              <li key={entry.id} className="px-3 py-3 sm:px-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-medium">{entry.summary}</p>
                  <time className="text-xs text-muted-foreground">
                    {formatISTDateTime(entry.createdAt)} IST
                  </time>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.actorName} ({entry.actorLogin}) · {entry.entityType}
                  {leadHref ? (
                    <>
                      {" · "}
                      <Link href={leadHref} className="hover:underline">
                        Open
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
