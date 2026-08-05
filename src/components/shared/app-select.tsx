"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  size?: "sm" | "default";
};

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  disabled,
  size = "default",
}: AppSelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Select
      value={value || null}
      onValueChange={(next) => {
        if (next != null) onValueChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        className={cn("w-full min-w-0", triggerClassName, className)}
      >
        <SelectValue placeholder={placeholder}>
          {selected ? selected.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="z-[100] min-w-[var(--anchor-width)]"
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
