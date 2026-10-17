"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, endOfMonth, endOfWeek, format, isAfter, isSameDay, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { Droplet, Loader2 } from "lucide-react";
import { ConfirmCard } from "@/components/confirm-card";
import { EventCard } from "@/components/event-card";
import { MonthCalendar } from "@/components/month-calendar";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { HEALTH_KEYS, useCycle, useDailyLogs, useEvents, usePeriods } from "@/lib/client/hooks";
import Link from "next/link";
import { SYMPTOM_LABELS, type SymptomCode } from "@/lib/enums";
import { DEFAULT_PERIOD_LENGTH_DAYS } from "@/lib/scoring/constants";
import type { PainEventDTO, PainEventInput } from "@/lib/types";

function toInitial(e: PainEventDTO): Partial<PainEventInput> {
  return {
    occurredAt: new Date(e.occurredAt),
    painScore: e.painScore,
    descriptors: e.descriptors,
    locations: e.locations,
    onsetNote: e.onsetNote,
    durationMinutes: e.durationMinutes,
    isPeriodDay: e.isPeriodDay,
    bleeding: e.bleeding,
    functionalImpact: e.functionalImpact,
    missedActivity: e.missedActivity,
    bedBound: e.bedBound,
    associated: e.associated,
    medications: e.medications,
    redFlags: e.redFlags,
    transcript: e.transcript,
    transcriptEn: e.transcriptEn,
    languageDetected: e.languageDetected === "hi" || e.languageDetected === "ml" || e.languageDetected === "mixed" || e.languageDetected === "other" ? e.languageDetected : "en",
    source: e.source,
    confidence: e.confidence,
  };
}

export default function TimelinePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [editing, setEditing] = useState<PainEventDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const from = useMemo(() => startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), [month]);
  const to = useMemo(() => endOfWeek(endOfMonth(month), { weekStartsOn: 1 }), [month]);
  const events = useEvents(from, to);
  const periods = usePeriods();
  const cycle = useCycle();
  const dailyLogs = useDailyLogs(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"));
  const predictedDays = useMemo(() => new Set<string>(cycle.data?.shading.predictedPeriod ?? []), [cycle.data]);
  const fertileDays = useMemo(() => new Set<string>(cycle.data?.shading.fertile ?? []), [cycle.data]);
  const loggedDays = useMemo(() => new Set<string>((dailyLogs.data ?? []).map((l) => l.date)), [dailyLogs.data]);

  const maxPainByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events.data ?? []) {
      const k = format(new Date(e.occurredAt), "yyyy-MM-dd");
      m.set(k, Math.max(m.get(k) ?? 0, e.painScore));
    }
    return m;
  }, [events.data]);

  const periodDays = useMemo(() => {
    const s = new Set<string>();
    const today = startOfDay(new Date());
    for (const p of periods.data?.periods ?? []) {
      const start = startOfDay(new Date(p.startDate));
      let end = p.endDate ? startOfDay(new Date(p.endDate)) : addDays(start, DEFAULT_PERIOD_LENGTH_DAYS - 1);
      if (!p.endDate && isAfter(end, today)) end = today;
      for (let d = start; d <= end; d = addDays(d, 1)) s.add(format(d, "yyyy-MM-dd"));
    }
    for (const e of events.data ?? []) if (e.isPeriodDay) s.add(format(new Date(e.occurredAt), "yyyy-MM-dd"));
    for (const l of dailyLogs.data ?? []) if (l.flow === "light" || l.flow === "medium" || l.flow === "heavy") s.add(l.date);
    return s;
  }, [periods.data, events.data, dailyLogs.data]);
  const dayLog = (dailyLogs.data ?? []).find((l) => l.date === format(selected, "yyyy-MM-dd"));

  const dayEvents = (events.data ?? []).filter((e) => isSameDay(new Date(e.occurredAt), selected));
  const periodOnDay = (periods.data?.periods ?? []).find((p) => {
    const start = startOfDay(new Date(p.startDate));
    const end = p.endDate ? startOfDay(new Date(p.endDate)) : addDays(start, DEFAULT_PERIOD_LENGTH_DAYS - 1);
    const d = startOfDay(selected);
    return d >= start && d <= end;
  });
  const openPeriod = (periods.data?.periods ?? []).find((p) => p.endDate === null);

  const invalidate = () => Promise.all(HEALTH_KEYS.map((k) => qc.invalidateQueries({ queryKey: [...k] })));

  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/pain-events?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: invalidate,
    onError: (e) => setActionError(errorMessage(e)),
  });
  const periodAction = useMutation({
    mutationFn: (body: { action: "start" | "end"; date: string } | { action: "delete"; id: string }) => apiFetch("/api/periods", { method: "POST", json: body }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(errorMessage(e)),
  });

  // Period dates are logged at midday so they never shift a day across time zones.
  const middayIso = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString();
  const selectedIsFuture = startOfDay(selected) > startOfDay(new Date());

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Calendar" subtitle="Tap a day to log, edit, or mark your period. Predictions are estimates." />

      {events.isError || periods.isError ? (
        <ErrorState message="Couldn't load your timeline." onRetry={() => { void events.refetch(); void periods.refetch(); }} />
      ) : (
        <MonthCalendar month={month} onMonthChange={setMonth} selected={selected} onSelect={setSelected} maxPainByDay={maxPainByDay} periodDays={periodDays} predictedDays={predictedDays} fertileDays={fertileDays} loggedDays={loggedDays} />
      )}

      <section aria-label="Selected day" className="flex flex-col gap-3">
        <h2 className="font-semibold">{format(selected, "EEEE d MMMM")}</h2>

        <div className="flex flex-wrap gap-2">
          {!periodOnDay && (
            <Button
              variant="secondary"
              size="sm"
              disabled={periodAction.isPending || selectedIsFuture}
              onClick={() => periodAction.mutate({ action: "start", date: middayIso(selected) })}
            >
              <Droplet /> Period started this day
            </Button>
          )}
          {openPeriod && startOfDay(selected) >= startOfDay(new Date(openPeriod.startDate)) && (
            <Button variant="secondary" size="sm" disabled={periodAction.isPending || selectedIsFuture} onClick={() => periodAction.mutate({ action: "end", date: middayIso(selected) })}>
              <Droplet /> Period ended this day
            </Button>
          )}
          {periodOnDay && (
            <Button variant="ghost" size="sm" disabled={periodAction.isPending} onClick={() => periodAction.mutate({ action: "delete", id: periodOnDay.id })}>
              Remove this period
            </Button>
          )}
          {periodAction.isPending && <Loader2 className="h-5 w-5 animate-spin text-plum-600" aria-label="Saving" />}
        </div>
        {!selectedIsFuture && (
          <div className="rounded-lg border border-sand-200 bg-white p-3">
            {dayLog ? (
              <div className="text-sm">
                <p className="font-semibold">Daily log</p>
                <p className="text-sand-600">
                  {[dayLog.flow && dayLog.flow !== "none" ? `Flow: ${dayLog.flow}` : null, dayLog.pbacScore ? `pad chart ${dayLog.pbacScore}` : null, dayLog.mood ? `mood ${dayLog.mood}/5` : null, dayLog.sleepHours !== null ? `sleep ${dayLog.sleepHours}h` : null].filter(Boolean).join(" · ") || "No details"}
                </p>
                {dayLog.symptoms.length > 0 && <p className="mt-1">{dayLog.symptoms.map((x) => SYMPTOM_LABELS[x as SymptomCode] ?? x).join(", ")}</p>}
              </div>
            ) : (
              <p className="text-sm text-sand-600">No daily log for this day.</p>
            )}
            <Link href={`/log?date=${format(selected, "yyyy-MM-dd")}`} className="mt-2 inline-flex h-10 items-center rounded-md bg-plum-600 px-4 text-sm font-semibold text-white">
              {dayLog ? "Edit day" : "Log this day"}
            </Link>
          </div>
        )}
        {actionError && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">{actionError}</p>}

        {events.isLoading ? (
          <LoadingState />
        ) : dayEvents.length === 0 ? (
          <EmptyState title="No pain episodes logged this day" />
        ) : (
          dayEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onEdit={() => setEditing(e)}
              deleting={del.isPending}
              onDelete={() => {
                if (window.confirm("Delete this log? This can't be undone.")) del.mutate(e.id);
              }}
            />
          ))
        )}
      </section>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Edit log">
        {editing && (
          <ConfirmCard
            key={editing.id}
            mode="edit"
            eventId={editing.id}
            initial={toInitial(editing)}
            confidence={1}
            onCancel={() => setEditing(null)}
            onSaved={(score) => {
              setEditing(null);
              if (score.level === "URGENT") router.push("/urgent");
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
