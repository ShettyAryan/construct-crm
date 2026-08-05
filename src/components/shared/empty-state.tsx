import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:px-6 sm:py-16",
        className
      )}
    >
      <div className="mb-3 rounded-full bg-muted p-3">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
