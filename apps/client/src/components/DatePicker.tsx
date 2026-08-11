"use client";

import { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, startOfDay } from "date-fns";
import { Popover } from "@base-ui/react/popover";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  placeholder?: string;
  id?: string;
}

function toDate(iso: string): Date {
  return parse(iso, "yyyy-MM-dd", new Date());
}

function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select date",
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? toDate(value) : undefined;
  const disabled = minDate ? { before: toDate(minDate) } : undefined;
  const defaultMonth = selected || (minDate ? toDate(minDate) : startOfDay(new Date()));

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(toISO(date));
        setOpen(false);
      }
    },
    [onChange],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        className={cn(
          "relative flex w-full min-w-0 max-w-full items-center gap-2 pl-10 pr-3 sm:pr-4 py-3 border border-border rounded-lg bg-white",
          "text-left text-base sm:text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          !value && "text-muted",
        )}
      >
        <Calendar
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 shrink-0 text-muted"
          aria-hidden
        />
        <span className="min-w-0 truncate">
          {value ? format(toDate(value), "MMM d, yyyy") : placeholder}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={12}
        >
          <Popover.Popup
            className={cn(
              "z-50 max-w-[min(100vw-1.5rem,20rem)] overflow-x-auto",
              "bg-white border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-2 sm:p-3",
            )}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={defaultMonth}
              disabled={disabled}
              classNames={{
                root: "text-sm w-full min-w-0",
                months: "flex flex-col",
                month: "space-y-3 w-full",
                month_caption:
                  "relative flex justify-center items-center h-9 px-8",
                caption_label: "text-sm font-medium text-foreground",
                nav: "absolute inset-x-0 top-0 flex items-center justify-between px-0",
                button_previous:
                  "size-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-subtle transition-colors",
                button_next:
                  "size-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-subtle transition-colors",
                weekdays: "grid grid-cols-7 mb-1",
                weekday:
                  "text-muted text-xs font-medium text-center w-full min-w-0",
                weeks: "space-y-1",
                week: "grid grid-cols-7",
                day: "text-center min-w-0",
                day_button: cn(
                  "mx-auto size-8 sm:size-9 rounded-md text-sm transition-colors",
                  "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30",
                ),
                selected:
                  "!bg-primary !text-white hover:!bg-primary rounded-md",
                today: "bg-subtle text-foreground font-semibold rounded-md",
                outside: "text-muted opacity-50",
                disabled: "text-muted !opacity-30 pointer-events-none",
                hidden: "invisible",
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
