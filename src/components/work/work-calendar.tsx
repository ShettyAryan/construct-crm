"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/shared/app-select";
import {
  formatIST,
  formatISTDate,
  parseISTInput,
  TIMEZONE,
} from "@/lib/datetime";
import { formatInTimeZone } from "date-fns-tz";
import {
  updateProjectDeadline,
  updateProjectProgress,
} from "@/lib/actions/work";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";
import { cn } from "@/lib/utils";
import type { WorkProjectRow } from "@/components/work/work-list";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayKey(date: Date | string) {
  return formatInTimeZone(new Date(date), TIMEZONE, "yyyy-MM-dd");
}

function shiftDay(key: string, days: number) {
  const next = new Date(parseISTInput(key).getTime() + days * 24 * 60 * 60 * 1000);
  return dayKey(next);
}

function daysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function monthDays(monthKey: string) {
  const first = `${monthKey}-01`;
  const isoDow = Number(formatInTimeZone(parseISTInput(first), TIMEZONE, "i"));
  const start = shiftDay(first, -(isoDow - 1));
  const count = Math.ceil((isoDow - 1 + daysInMonth(monthKey)) / 7) * 7;
  return Array.from({ length: count }, (_, index) => shiftDay(start, index));
}

function monthLabel(monthKey: string) {
  return formatIST(parseISTInput(`${monthKey}-01`), "MMMM yyyy");
}

export function WorkCalendar({
  projects,
  canEdit,
}: {
  projects: WorkProjectRow[];
  canEdit: boolean;
}) {
  const today = dayKey(new Date());
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [assignId, setAssignId] = useState("");
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => monthDays(monthKey), [monthKey]);
  const byDay = useMemo(() => {
    const map = new Map<string, WorkProjectRow[]>();
    for (const project of projects) {
      if (!project.deadline) continue;
      const key = dayKey(project.deadline);
      const list = map.get(key) ?? [];
      list.push(project);
      map.set(key, list);
    }
    return map;
  }, [projects]);

  const undated = projects.filter((project) => !project.deadline);
  const selectedProjects = byDay.get(selected) ?? [];

  function changeMonth(offset: number) {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    const next = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    setMonthKey(next);
    setSelected(`${next}-01`);
  }

  async function placeOnDay() {
    if (!assignId) return;
    setSaving(true);
    try {
      await updateProjectDeadline(assignId, selected);
      toast.success("Deadline set");
      setAssignId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not set deadline");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <div className="text-center">
            <p className="text-sm font-medium">{monthLabel(monthKey)}</p>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => {
                setMonthKey(today.slice(0, 7));
                setSelected(today);
              }}
            >
              Today
            </button>
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-1 py-1.5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = day.startsWith(monthKey);
            const due = byDay.get(day) ?? [];
            const isToday = day === today;
            const isSelected = day === selected;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  "min-h-20 border-r border-b p-1 text-left align-top sm:min-h-28 sm:p-1.5",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                  isSelected && "bg-muted/70",
                  "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-[11px] sm:text-xs",
                    isToday && "bg-foreground text-background"
                  )}
                >
                  {Number(day.slice(-2))}
                </span>
                <div className="mt-1 space-y-1">
                  {due.slice(0, 2).map((project) => (
                    <ProjectChip key={project.id} project={project} today={today} />
                  ))}
                  {due.length > 2 ? (
                    <p className="px-1 text-[10px] text-muted-foreground">+{due.length - 2}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">{formatISTDate(parseISTInput(selected))}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selectedProjects.length === 0
              ? "Nothing due"
              : `${selectedProjects.length} due`}
          </p>
          <div className="mt-3 space-y-3">
            {selectedProjects.map((project) => (
              <ProjectProgress
                key={project.id}
                project={project}
                today={today}
                canEdit={canEdit}
              />
            ))}
          </div>
          {canEdit && projects.length > 0 ? (
            <div className="mt-4 grid gap-2">
              <p className="text-xs text-muted-foreground">Set a deadline on this day</p>
              <AppSelect
                value={assignId}
                onValueChange={setAssignId}
                options={projects.map((project) => ({
                  value: project.id,
                  label: `${project.name} · ${project.client.company}`,
                }))}
                placeholder="Choose a project"
              />
              <Button size="sm" disabled={!assignId || saving} onClick={placeOnDay}>
                {saving ? "Saving…" : "Place on this day"}
              </Button>
            </div>
          ) : null}
        </section>

        {undated.length > 0 ? (
          <section className="rounded-lg border p-3">
            <h2 className="text-sm font-medium">No deadline</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose a day, then place the project on it.
            </p>
            <ul className="mt-3 space-y-2">
              {undated.map((project) => (
                <li key={project.id}>
                  <Link href={`/work/${project.id}`} className="text-sm hover:underline">
                    {project.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{project.client.company}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function ProjectChip({
  project,
  today,
}: {
  project: WorkProjectRow;
  today: string;
}) {
  const overdue =
    project.status !== "Completed" &&
    project.deadline != null &&
    dayKey(project.deadline) < today;
  return (
    <span
      className={cn(
        "block truncate rounded px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]",
        project.status === "Completed" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
        overdue && "bg-rose-500/15 text-rose-800 dark:text-rose-300",
        project.status !== "Completed" && !overdue && "bg-sky-500/15 text-sky-800 dark:text-sky-300"
      )}
    >
      {project.name}
      <span className="mt-0.5 block h-0.5 overflow-hidden rounded-full bg-current/20">
        <span className="block h-full bg-current" style={{ width: `${project.progress}%` }} />
      </span>
    </span>
  );
}

function ProjectProgress({
  project,
  today,
  canEdit,
}: {
  project: WorkProjectRow;
  today: string;
  canEdit: boolean;
}) {
  const [progress, setProgress] = useState(project.progress);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setProgress(project.progress);
  }, [project.progress]);
  const overdue =
    project.status !== "Completed" &&
    project.deadline != null &&
    dayKey(project.deadline) < today;

  async function commit(next: number) {
    setSaving(true);
    try {
      await updateProjectProgress(project.id, next);
    } catch (error) {
      setProgress(project.progress);
      toast.error(error instanceof Error ? error.message : "Could not update progress");
    } finally {
      setSaving(false);
    }
  }

  async function clearDeadline() {
    try {
      await updateProjectDeadline(project.id, null);
      toast.success("Deadline cleared");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear deadline");
    }
  }

  return (
    <div className="rounded-md border p-2">
      <Link href={`/work/${project.id}`} className="text-sm font-medium hover:underline">
        {project.name}
      </Link>
      <p className="text-xs text-muted-foreground">
        {project.client.company} · {PROJECT_STATUS_LABELS[project.status]}
        {overdue ? " · Overdue" : ""}
      </p>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span>{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          disabled={!canEdit || saving}
          aria-label={`Progress for ${project.name}`}
          className="w-full accent-foreground"
          onChange={(event) => setProgress(Number(event.target.value))}
          onPointerUp={(event) => commit(Number(event.currentTarget.value))}
          onKeyUp={(event) => commit(Number(event.currentTarget.value))}
        />
      </div>
      {canEdit ? (
        <button
          type="button"
          className="mt-1 text-xs text-muted-foreground hover:underline"
          onClick={clearDeadline}
        >
          Clear deadline
        </button>
      ) : null}
    </div>
  );
}
