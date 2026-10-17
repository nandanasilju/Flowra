"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Check } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { apiFetch } from "@/lib/client/api";
import { HEALTH_KEYS, useDailyLogs, useMe } from "@/lib/client/hooks";
import { ymd } from "@/lib/cycles";
import { FLOWS, SYMPTOM_LABELS, type SymptomCode } from "@/lib/enums";
import type { DailyLogDTO } from "@/lib/dto";

const FLOW_LABEL: Record<(typeof FLOWS)[number], string> = { none: "No flow", spotting: "Spotting", light: "Light", medium: "Medium", heavy: "Heavy" };

/** One-tap logging for today: flow, mood and the user's quick symptoms. */
export function QuickLog() {
  const today = ymd(new Date());
  const me = useMe();
  const logs = useDailyLogs(today, today);
  const qc = useQueryClient();
  const current: DailyLogDTO | undefined = logs.data?.[0];
  const quick = (me.data?.settings.quickSymptoms ?? ["cramps", "bloating", "fatigue", "low_mood"]) as SymptomCode[];

  const save = useMutation({
    mutationFn: (patch: Partial<DailyLogDTO>) =>
      apiFetch("/api/daily-logs", {
        method: "POST",
        json: {
          date: today,
          flow: current?.flow ?? null,
          pbac: current?.pbac ?? {},
          mood: current?.mood ?? null,
          energy: current?.energy ?? null,
          sleepHours: current?.sleepHours ?? null,
          symptoms: current?.symptoms ?? [],
          custom: current?.custom ?? [],
          notes: current?.notes ?? null,
          ...patch,
        },
      }),
    onSuccess: () => Promise.all(HEALTH_KEYS.map((k) => qc.invalidateQueries({ queryKey: [...k] }))),
  });

  const toggle = (s: string) => {
    const set = new Set(current?.symptoms ?? []);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    save.mutate({ symptoms: [...set] });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sand-600">Flow today</p>
        <div className="flex flex-wrap gap-2">
          {FLOWS.map((f) => (
            <Chip key={f} selected={current?.flow === f} onClick={() => save.mutate({ flow: current?.flow === f ? null : f })}>
              {FLOW_LABEL[f]}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sand-600">Mood</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Mood">
          {["😣", "🙁", "😐", "🙂", "😄"].map((e, i) => (
            <button
              key={e}
              type="button"
              role="radio"
              aria-checked={current?.mood === i + 1}
              aria-label={["Very low", "Low", "Okay", "Good", "Great"][i]}
              onClick={() => save.mutate({ mood: current?.mood === i + 1 ? null : i + 1 })}
              className={`h-11 w-11 rounded-full border text-xl ${current?.mood === i + 1 ? "border-plum-600 bg-plum-50" : "border-sand-200 bg-white"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sand-600">Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {quick.map((s) => (
            <Chip key={s} selected={Boolean(current?.symptoms.includes(s))} onClick={() => toggle(s)}>
              {SYMPTOM_LABELS[s] ?? s}
            </Chip>
          ))}
          <Link href={`/log?date=${today}`} className="inline-flex min-h-10 items-center rounded-full border border-dashed border-plum-300 px-3 text-sm font-medium text-plum-700">
            + More (pad chart, sleep, notes)
          </Link>
        </div>
      </div>
      {save.isSuccess && <p className="flex items-center gap-1 text-xs text-teal-700" role="status"><Check className="h-3.5 w-3.5" /> Saved</p>}
      {save.isError && <p className="text-xs text-red-700" role="alert">Couldn&apos;t save. Please try again.</p>}
    </div>
  );
}
