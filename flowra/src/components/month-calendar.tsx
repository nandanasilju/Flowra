"use client";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { painColor } from "@/lib/levels-ui";
import { cn } from "@/lib/utils";

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: Date;
  onSelect: (d: Date) => void;
  maxPainByDay: Map<string, number>;
  periodDays: Set<string>;
  predictedDays?: Set<string>;
  fertileDays?: Set<string>;
  loggedDays?: Set<string>;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({ month, onMonthChange, selected, onSelect, maxPainByDay, periodDays, predictedDays, fertileDays, loggedDays }: MonthCalendarProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  // Allow browsing a few months ahead to see predictions.
  const nextDisabled = startOfMonth(addMonths(month, 1)) > addMonths(new Date(), 4);

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))}>
          <ChevronLeft />
        </Button>
        <h2 className="font-semibold" aria-live="polite">{format(month, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="icon" aria-label="Next month" disabled={nextDisabled} onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-sand-600" aria-hidden>
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div role="grid" className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const pain = maxPainByDay.get(key);
          const period = periodDays.has(key);
          const predicted = !period && Boolean(predictedDays?.has(key));
          const fertile = !period && !predicted && Boolean(fertileDays?.has(key));
          const logged = Boolean(loggedDays?.has(key));
          const inMonth = isSameMonth(d, month);
          const isSel = isSameDay(d, selected);
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-selected={isSel}
              aria-label={`${format(d, "d MMMM")}${pain !== undefined ? `, max pain ${pain}` : ""}${period ? ", period day" : ""}${predicted ? ", predicted period" : ""}${fertile ? ", estimated fertile day" : ""}${logged ? ", logged" : ""}`}
              onClick={() => onSelect(d)}
              className={cn(
                "relative flex h-11 flex-col items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
                inMonth ? "text-sand-800" : "text-sand-400",
                period && "bg-plum-100 font-semibold text-plum-800",
                predicted && "border border-dashed border-plum-300 bg-plum-50/50",
                fertile && "bg-teal-50",
                isSel && "ring-2 ring-plum-600",
                isToday(d) && "font-bold",
              )}
            >
              {format(d, "d")}
              {logged && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-plum-500" aria-hidden />}
              {pain !== undefined && <span className="absolute bottom-1 h-2 w-2 rounded-full" style={{ backgroundColor: painColor(pain) }} aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-sand-600" aria-hidden>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: painColor(2) }} /> Pain 1–3</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: painColor(5) }} /> 4–6</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: painColor(8) }} /> 7–10</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-plum-100" /> Period</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-dashed border-plum-300" /> Predicted period</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-teal-50 ring-1 ring-teal-100" /> Est. fertile</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-plum-500" /> Logged</span>
      </div>
    </div>
  );
}
