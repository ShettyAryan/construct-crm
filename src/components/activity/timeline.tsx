import {
  Bell,
  Calendar,
  ArrowRightLeft,
  Phone,
  StickyNote,
} from "lucide-react";
import type { Activity, ActivityType } from "@prisma/client";
import { EmptyState } from "@/components/shared/empty-state";
import { formatISTDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const iconMap: Record<ActivityType, typeof Phone> = {
  CALL: Phone,
  MEETING: Calendar,
  NOTE: StickyNote,
  FOLLOW_UP: Bell,
  STATUS_CHANGE: ArrowRightLeft,
};

export function Timeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Log a call, note, meeting, or follow-up to build the timeline."
        className="py-10"
      />
    );
  }

  return (
    <ol className="relative ml-3 space-y-0 border-l border-border">
      {activities.map((activity, i) => {
        const Icon = iconMap[activity.type];
        return (
          <li key={activity.id} className="relative pb-6 pl-6 last:pb-0">
            <span
              className={cn(
                "absolute -left-3.5 flex size-7 items-center justify-center rounded-full border bg-background",
                i === 0 && "ring-2 ring-foreground/10"
              )}
            >
              <Icon className="size-3.5 text-muted-foreground" />
            </span>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-sm font-medium">{activity.title}</p>
                <time className="text-xs text-muted-foreground">
                  {formatISTDateTime(activity.createdAt)} IST
                </time>
              </div>
              {activity.body ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.body}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
