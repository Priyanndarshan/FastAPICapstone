"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const buttonClass =
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 data-[empty=true]:text-slate-500";

function toDate(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

function fromDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
  id,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const date = toDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          data-empty={!value}
          className={`${buttonClass} ${className}`}
          aria-label={ariaLabel}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-4 shrink-0 text-slate-500" />
            {date ? format(date, "PPP") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[min(100vw-2rem,320px)] p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            if (selected) {
              onChange(fromDate(selected));
              setOpen(false);
            }
          }}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  );
}
