"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { HEALTH_KEYS, useDailyLogs, useMe } from "@/lib/client/hooks";
import { addDaysYmd, ymd } from "@/lib/cycles";
import {
  FLOWS,
  PBAC_HEAVY_THRESHOLD,
  PBAC_ITEMS,
  PBAC_KEYS,
  SYMPTOM_GROUP_LABELS,
  SYMPTOM_GROUPS,
  SYMPTOM_LABELS,
  pbacScore,
  type Pbac,
  type PbacKey,
} from "@/lib/enums";

const FLOW_LABEL: Record<(typeof FLOWS)[number], string> = { none: "No bleeding", spotting: "Spotting", light: "Light", medium: "Medium", heavy: "Heavy" };
const PAD_ICON: Partial<Record<PbacKey, string>> = { padLight: "▁", padMedium: "▄", padFull: "█", tamponLight: "▁", tamponMedium: "▄", tamponFull: "█" };

interface FormState {
  flow: (typeof FLOWS)[number] | null;
  pbac: Pbac;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  symptoms: string[];
  custom: string[];
  notes: string;
}

const EMPTY: FormState = { flow: null, pbac: {}, mood: null, energy: null, sleepHours: null, symptoms: [], custom: [], notes: "" };

function LogInner() {
  const params = useSearchParams();
  const router = useRouter();
  const today = ymd(new Date());
  const date = params.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") ?? "") && (params.get("date") ?? "") <= today ? (params.get("date") as string) : today;
  const me = useMe();
  const logs = useDailyLogs(date, date);
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!logs.data || loadedFor === date) return;
    const l = logs.data[0];
    setForm(l ? { flow: l.flow, pbac: l.pbac, mood: l.mood, energy: l.energy, sleepHours: l.sleepHours, symptoms: l.symptoms, custom: l.custom, notes: l.notes ?? "" } : EMPTY);
    setLoadedFor(date);
  }, [logs.data, date, loadedFor]);

  const save = useMutation({
    mutationFn: () => apiFetch("/api/daily-logs", { method: "POST", json: { date, ...form, notes: form.notes.trim() || null } }),
    onSuccess: async () => {
      await Promise.all(HEALTH_KEYS.map((k) => qc.invalidateQueries({ queryKey: [...k] })));
      router.push("/home");
    },
  });
  const del = useMutation({
    mutationFn: () => apiFetch(`/api/daily-logs?date=${date}`, { method: "DELETE" }),
    onSuccess: async () => {
      await Promise.all(HEALTH_KEYS.map((k) => qc.invalidateQueries({ queryKey: [...k] })));
      setForm(EMPTY);
    },
  });

  const score = useMemo(() => pbacScore(form.pbac), [form.pbac]);
  const toggle = (s: string) => setForm((f) => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s] }));
  const toggleCustom = (s: string) => setForm((f) => ({ ...f, custom: f.custom.includes(s) ? f.custom.filter((x) => x !== s) : [...f.custom, s] }));
  const setPbac = (k: PbacKey, delta: number) => setForm((f) => ({ ...f, pbac: { ...f.pbac, [k]: Math.max(0, Math.min(50, (f.pbac[k] ?? 0) + delta)) } }));
  const customOptions = me.data?.settings.customSymptoms ?? [];
  const bleeding = form.flow && form.flow !== "none";

  if (logs.isLoading) return <LoadingState />;
  if (logs.isError) return <ErrorState message="Couldn't load this day." onRetry={() => logs.refetch()} />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader
        title="Daily log"
        subtitle={new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        back="/home"
        action={
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => router.replace(`/log?date=${addDaysYmd(date, -1)}`)} aria-label="Previous day">‹</Button>
            <Button variant="ghost" size="sm" disabled={date >= today} onClick={() => router.replace(`/log?date=${addDaysYmd(date, 1)}`)} aria-label="Next day">›</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>Bleeding</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {FLOWS.map((f) => (
              <Chip key={f} selected={form.flow === f} onClick={() => setForm((x) => ({ ...x, flow: x.flow === f ? null : f }))}>{FLOW_LABEL[f]}</Chip>
            ))}
          </div>
          {bleeding && (
            <div className="rounded-md bg-sand-100 p-3">
              <p className="text-sm font-semibold">Pad & tampon chart (optional)</p>
              <p className="mb-2 text-xs text-sand-600">Count products used today by how soaked they were. This gives a clinically used heavy-bleeding score (PBAC).</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PBAC_KEYS.map((k) => (
                  <div key={k} className="flex items-center justify-between gap-2 rounded-md bg-white p-2">
                    <span className="text-sm">
                      {PAD_ICON[k] && <span aria-hidden className="mr-1 inline-block w-4 text-center font-mono text-level-urgent">{PAD_ICON[k]}</span>}
                      {PBAC_ITEMS[k].label}
                    </span>
                    <span className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-9 w-9" aria-label={`Less: ${PBAC_ITEMS[k].label}`} onClick={() => setPbac(k, -1)}><Minus /></Button>
                      <span className="w-6 text-center font-semibold tabular-nums">{form.pbac[k] ?? 0}</span>
                      <Button variant="outline" size="icon" className="h-9 w-9" aria-label={`More: ${PBAC_ITEMS[k].label}`} onClick={() => setPbac(k, 1)}><Plus /></Button>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm">Today&apos;s score: <strong>{score}</strong>. A total of {PBAC_HEAVY_THRESHOLD}+ across a period suggests heavy bleeding worth discussing with a doctor.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mood, energy & sleep</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-sm font-medium">Mood</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Mood">
              {["😣", "🙁", "😐", "🙂", "😄"].map((e, i) => (
                <button key={e} type="button" role="radio" aria-checked={form.mood === i + 1} aria-label={["Very low", "Low", "Okay", "Good", "Great"][i]} onClick={() => setForm((f) => ({ ...f, mood: f.mood === i + 1 ? null : i + 1 }))} className={`h-11 w-11 rounded-full border text-xl ${form.mood === i + 1 ? "border-plum-600 bg-plum-50" : "border-sand-200 bg-white"}`}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Energy</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Energy">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={form.energy === n} onClick={() => setForm((f) => ({ ...f, energy: f.energy === n ? null : n }))} className={`h-11 w-11 rounded-full border font-semibold ${form.energy === n ? "border-teal-600 bg-teal-50 text-teal-700" : "border-sand-200 bg-white"}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="sleep" className="mb-1 block text-sm font-medium">Sleep (hours)</label>
            <Input id="sleep" type="number" inputMode="decimal" min={0} max={24} step={0.5} value={form.sleepHours ?? ""} onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value === "" ? null : Math.max(0, Math.min(24, Number(e.target.value))) }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Symptoms</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(Object.keys(SYMPTOM_GROUPS) as (keyof typeof SYMPTOM_GROUPS)[]).map((g) => (
            <div key={g}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sand-600">{SYMPTOM_GROUP_LABELS[g]}</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_GROUPS[g].map((s) => (
                  <Chip key={s} tone={s === "fever" ? "danger" : "plum"} selected={form.symptoms.includes(s)} onClick={() => toggle(s)}>{SYMPTOM_LABELS[s]}</Chip>
                ))}
              </div>
            </div>
          ))}
          {customOptions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sand-600">My symptoms</p>
              <div className="flex flex-wrap gap-2">
                {customOptions.map((s) => <Chip key={s} selected={form.custom.includes(s)} onClick={() => toggleCustom(s)}>{s}</Chip>)}
              </div>
            </div>
          )}
          <Link href="/profile#symptoms" className="text-sm font-semibold text-plum-600">+ Add your own symptoms in Settings</Link>
          {form.symptoms.includes("fever") && (form.symptoms.includes("pelvic_pain") || form.symptoms.includes("cramps")) && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">
              Fever with pelvic pain can need prompt care. If the pain is severe or you feel very unwell, <Link href="/urgent" className="font-semibold underline">see urgent guidance</Link>.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes (encrypted)</CardTitle></CardHeader>
        <CardContent>
          <Textarea aria-label="Notes" value={form.notes} maxLength={2000} placeholder="Anything else about today" onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </CardContent>
      </Card>

      {(save.isError || del.isError) && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">{errorMessage(save.error ?? del.error)}</p>}

      <div className="sticky bottom-20 z-10 flex gap-2 rounded-lg border border-sand-200 bg-white p-3 shadow-lg lg:bottom-4">
        {logs.data?.[0] && (
          <Button variant="ghost" className="text-red-700" disabled={del.isPending} onClick={() => window.confirm("Delete this day's log?") && del.mutate()}>
            <Trash2 /> Delete
          </Button>
        )}
        <Button className="flex-1" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />} Save day
        </Button>
      </div>
      <p className="text-center text-xs text-sand-600">Pain episodes are logged separately with the mic on the Today screen.</p>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LogInner />
    </Suspense>
  );
}
