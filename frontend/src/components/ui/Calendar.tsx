import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";

export type CalendarProps = ComponentProps<typeof DayPicker>;

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      className={`rdp-root p-2 ${className ?? ""}`}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
