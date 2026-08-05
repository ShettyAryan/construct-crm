import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl break-words">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground break-words">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
