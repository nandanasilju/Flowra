"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, Crown, Download, FileText, Loader2, LogOut, Shield, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { qk, useMe, usePeriods } from "@/lib/client/hooks";
import { GOALS, GOAL_LABELS, SYMPTOM_LABELS, SYMPTOMS, type Goal } from "@/lib/enums";
import type { UserSettings } from "@/lib/settings";
import { LABELS, LANGUAGES, type Language, type MeDTO } from "@/lib/types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };

function Row({ label, help, children, id }: { label: string; help?: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {help && <p className="text-xs text-sand-600">{help}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const me = useMe();
  const periods = usePeriods();
  const qc = useQueryClient();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [newSymptom, setNewSymptom] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const update = useMutation({
    mutationFn: (body: { language?: Language; personalizeShop?: boolean; avgCycleLength?: number | null; goal?: Goal; settings?: DeepPartial<UserSettings> }) =>
      apiFetch<{ user: MeDTO }>("/api/account", { method: "PATCH", json: body }),
    onSuccess: async (res, vars) => {
      qc.setQueryData(qk.me, res.user);
      await Promise.all([qc.invalidateQueries({ queryKey: qk.reminders }), qc.invalidateQueries({ queryKey: qk.recs }), qc.invalidateQueries({ queryKey: qk.cycle }), qc.invalidateQueries({ queryKey: qk.reminder })]);
      if (vars.settings?.accessibility) router.refresh();
      setError(null);
      setMessage("Saved.");
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const set = (settings: DeepPartial<UserSettings>) => update.mutate({ settings });

  const seed = useMutation({
    mutationFn: (persona: "anjali" | "mild" | "riya") => apiFetch(`/api/demo/seed?persona=${persona}`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      setMessage("Sample data loaded.");
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const logout = useMutation({
    mutationFn: () => apiFetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.clear();
      router.replace("/");
      router.refresh();
    },
  });
  const del = useMutation({
    mutationFn: () => apiFetch("/api/account", { method: "DELETE" }),
    onSuccess: () => {
      qc.clear();
      try {
        window.localStorage.removeItem("flowra_cart_v1");
      } catch {
        /* ignore */
      }
      router.replace("/");
      router.refresh();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  if (me.isLoading) return <LoadingState />;
  if (me.isError || !me.data) return <ErrorState message="Couldn't load your settings." onRetry={() => me.refetch()} />;
  const user = me.data;
  const s = user.settings;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title="Profile & settings" subtitle={user.email} />
      {message && <p role="status" className="rounded-md bg-teal-50 p-2 text-sm text-teal-700">{message}</p>}
      {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-plum-600" aria-hidden /> Plan: {user.plan === "plus" ? "Flowra Plus" : "Flowra Free"}</CardTitle>
          <CardDescription>Safety alerts, pattern awareness and your data controls are always free.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/pricing" className="inline-flex h-10 items-center rounded-md border border-sand-200 px-4 text-sm font-semibold">{user.plan === "plus" ? "Manage plan" : "See Plus (free during beta)"}</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your goal & language</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Goal">
            {GOALS.map((g) => <Chip key={g} selected={user.goal === g} onClick={() => update.mutate({ goal: g })}>{GOAL_LABELS[g]}</Chip>)}
          </div>
          <Select aria-label="Language" value={user.language} onChange={(e) => update.mutate({ language: e.target.value as Language })} disabled={update.isPending}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{LABELS.languages[l]}</option>)}
          </Select>
          <p className="text-xs text-sand-600">Used for voice prompts and follow-up questions. You can always speak in any mix.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-teal-600" aria-hidden /> Reminders</CardTitle>
          <CardDescription>Shown in Flowra and, if you allow notifications, as a notification while Flowra is open.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-sand-100">
          <Row label="Period coming soon" id="r-period">
            <div className="flex items-center gap-2">
              <Select aria-label="Days before" className="h-9 w-24" value={s.reminders.periodSoonDays} onChange={(e) => set({ reminders: { periodSoonDays: Number(e.target.value) } })}>
                {[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
              </Select>
              <Switch id="r-period" checked={s.reminders.periodSoon} onCheckedChange={(v) => set({ reminders: { periodSoon: v } })} />
            </div>
          </Row>
          <Row label="Daily log reminder" help="If you haven't logged today" id="r-daily">
            <Switch id="r-daily" checked={s.reminders.logDaily} onCheckedChange={(v) => set({ reminders: { logDaily: v } })} />
          </Row>
          <Row label="Fertile window" help="Estimate only, not contraception" id="r-fertile">
            <Switch id="r-fertile" checked={s.reminders.fertileWindow} onCheckedChange={(v) => set({ reminders: { fertileWindow: v } })} />
          </Row>
          <Row label="Appointments" id="r-appt">
            <Switch id="r-appt" checked={s.reminders.appointments} onCheckedChange={(v) => set({ reminders: { appointments: v } })} />
          </Row>
          <Row label="Export predicted periods to my calendar" help={user.plan === "plus" ? "Downloads an .ics file with alerts 2 days before" : "Plus feature"}>
            {user.plan === "plus" ? <a href="/api/calendar" className="text-sm font-semibold text-plum-600 underline">Download</a> : <Link href="/pricing" className="text-sm font-semibold text-plum-600 underline">Plus</Link>}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cycle & calendar</CardTitle>
          <CardDescription>{periods.data?.averageCycleLength ? `From your logs: about ${periods.data.averageCycleLength} days.` : "Log at least two period starts to calculate this automatically."}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-sand-100">
          <Row label="Show fertile-window estimates" id="c-fert">
            <Switch id="c-fert" checked={s.showFertility} onCheckedChange={(v) => set({ showFertility: v })} />
          </Row>
          <Row label="Usual cycle length (days)" help="Used until Flowra has enough history" id="cycle">
            <Input
              id="cycle"
              type="number"
              min={15}
              max={60}
              className="h-9 w-24"
              defaultValue={user.avgCycleLength ?? ""}
              onBlur={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                if (v === null || (v >= 15 && v <= 60)) update.mutate({ avgCycleLength: v });
                else setError("Cycle length must be between 15 and 60 days.");
              }}
            />
          </Row>
        </CardContent>
      </Card>

      <Card id="symptoms">
        <CardHeader>
          <CardTitle>Symptoms & shortcuts</CardTitle>
          <CardDescription>Choose up to 8 quick symptoms for the Today screen, and add your own.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((code) => {
              const on = s.quickSymptoms.includes(code);
              return (
                <Chip key={code} selected={on} onClick={() => set({ quickSymptoms: on ? s.quickSymptoms.filter((x) => x !== code) : [...s.quickSymptoms, code].slice(0, 8) })}>
                  {SYMPTOM_LABELS[code]}
                </Chip>
              );
            })}
          </div>
          <p className="text-sm font-medium">My own symptoms</p>
          <div className="flex flex-wrap gap-2">
            {s.customSymptoms.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-plum-50 px-3 py-1 text-sm">
                {c}
                <button type="button" aria-label={`Remove ${c}`} onClick={() => set({ customSymptoms: s.customSymptoms.filter((x) => x !== c) })}><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = newSymptom.trim(); if (v && !s.customSymptoms.includes(v)) set({ customSymptoms: [...s.customSymptoms, v].slice(0, 12) }); setNewSymptom(""); }}>
            <Input aria-label="New symptom" placeholder="e.g. Jaw pain" maxLength={30} value={newSymptom} onChange={(e) => setNewSymptom(e.target.value)} />
            <Button type="submit" variant="outline" disabled={!newSymptom.trim()}>Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wellness goals</CardTitle>
          <CardDescription>Personal goals shown on your Today screen (e.g. “Sleep 8 hours before exams”).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {s.wellnessGoals.map((g) => (
            <div key={g} className="flex items-center justify-between rounded-md bg-sand-100 px-3 py-2 text-sm">
              {g}
              <button type="button" aria-label={`Remove goal ${g}`} onClick={() => set({ wellnessGoals: s.wellnessGoals.filter((x) => x !== g) })}><X className="h-4 w-4" /></button>
            </div>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = newGoal.trim(); if (v) set({ wellnessGoals: [...s.wellnessGoals, v].slice(0, 5) }); setNewGoal(""); }}>
            <Input aria-label="New goal" placeholder="Add a goal" maxLength={60} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
            <Button type="submit" variant="outline" disabled={!newGoal.trim()}>Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card id="products">
        <CardHeader>
          <CardTitle>Shopping preferences</CardTitle>
          <CardDescription>Used only for product suggestions. Possible health conditions are never used.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Row label="Personalised product suggestions" help="Based on preferences, comfort symptoms and period timing" id="p-on">
            <Switch id="p-on" checked={user.personalizeShop} onCheckedChange={(v) => update.mutate({ personalizeShop: v })} />
          </Row>
          <div className="flex flex-wrap gap-2">
            {(["light", "medium", "heavy"] as const).map((f) => (
              <Chip key={f} selected={s.productPrefs.flow === f} onClick={() => set({ productPrefs: { flow: s.productPrefs.flow === f ? null : f } })}>{f[0].toUpperCase() + f.slice(1)} flow</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {([["cotton", "Cotton"], ["organic", "Organic"], ["reusable", "Reusable"], ["fragranceFree", "Fragrance-free"]] as const).map(([k, label]) => (
              <Chip key={k} selected={s.productPrefs[k]} onClick={() => set({ productPrefs: { [k]: !s.productPrefs[k] } })}>{label}</Chip>
            ))}
          </div>
          {s.dismissedProducts.length > 0 && (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => set({ dismissedProducts: [] })}>Show {s.dismissedProducts.length} hidden product{s.dismissedProducts.length > 1 ? "s" : ""} again</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Accessibility</CardTitle></CardHeader>
        <CardContent className="divide-y divide-sand-100">
          <Row label="Larger text" id="a-text"><Switch id="a-text" checked={s.accessibility.largeText} onCheckedChange={(v) => set({ accessibility: { largeText: v } })} /></Row>
          <Row label="Reduce motion" id="a-motion"><Switch id="a-motion" checked={s.accessibility.reduceMotion} onCheckedChange={(v) => set({ accessibility: { reduceMotion: v } })} /></Row>
          <Row label="Higher contrast" id="a-contrast"><Switch id="a-contrast" checked={s.accessibility.highContrast} onCheckedChange={(v) => set({ accessibility: { highContrast: v } })} /></Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden /> Privacy & data</CardTitle>
          <CardDescription>Audio is never stored. Notes and transcripts are encrypted. <Link href="/privacy" className="underline">Details</Link></CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Row label="Use cloud AI for voice and text notes" help="Off: your note isn't sent to Google Gemini; on-device speech recognition and keyword matching are used instead (less accurate)" id="pv-ai">
            <Switch id="pv-ai" checked={s.privacy.useCloudAi} onCheckedChange={(v) => set({ privacy: { useCloudAi: v } })} />
          </Row>
          <Row label="Save what I said (transcripts)" help="Off: only the structured fields are saved" id="pv-tx">
            <Switch id="pv-tx" checked={s.privacy.saveTranscripts} onCheckedChange={(v) => set({ privacy: { saveTranscripts: v } })} />
          </Row>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <a href="/api/export" download className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-sand-200 bg-white px-4 text-sm font-semibold hover:bg-sand-50"><Download className="h-4 w-4" aria-hidden /> Export all my data</a>
            <Link href="/summary" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-sand-200 bg-white px-4 text-sm font-semibold hover:bg-sand-50"><FileText className="h-4 w-4" aria-hidden /> Report & shared links</Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-plum-600" aria-hidden /> Demo tools</CardTitle>
          <CardDescription>Replaces your logs with labelled sample data, for demonstrations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {([["anjali", "Anjali: pain + heavy bleeding"], ["riya", "Riya: PCOS-linked pattern"], ["mild", "Meera: typical cycles"]] as const).map(([id, label]) => (
            <Button key={id} variant="secondary" disabled={seed.isPending} onClick={() => window.confirm(`Replace your logs with sample data (${label})?`) && seed.mutate(id)}>
              {seed.isPending && seed.variables === id && <Loader2 className="animate-spin" />} {label}
            </Button>
          ))}
          <Link href="/home?sample=redflag_faint" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Red-flag voice note
          </Link>
        </CardContent>
      </Card>

      {user.isAdmin && (
        <Link href="/admin" className="flex items-center gap-2 rounded-lg border border-sand-200 bg-white p-4 font-semibold"><Shield className="h-5 w-5" aria-hidden /> Admin: doctors & product links</Link>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Delete account</CardTitle>
          <CardDescription>Permanently deletes your account and everything in it (logs, periods, appointments, links, orders, and your encryption key). This can&apos;t be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <label htmlFor="confirm-delete" className="text-sm">Type <strong>DELETE</strong> to confirm</label>
          <Input id="confirm-delete" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} autoComplete="off" />
          <Button variant="destructive" disabled={deleteText !== "DELETE" || del.isPending} onClick={() => del.mutate()}>
            {del.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete my account and all data
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut /> Sign out</Button>
      <p className="text-center text-xs text-sand-600">Flowra does not diagnose. Predictions are estimates and not contraception. Emergency: 112 · Tele-MANAS: 14416</p>
    </div>
  );
}
