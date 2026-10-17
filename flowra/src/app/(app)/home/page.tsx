"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, CalendarClock, ChevronRight, HeartPulse, Keyboard, Lightbulb, Play } from "lucide-react";
import { CycleRing } from "@/components/cycle-ring";
import { Disclaimer } from "@/components/disclaimer";
import { EventCard } from "@/components/event-card";
import { LevelRing } from "@/components/level-ring";
import { MicButton } from "@/components/mic-button";
import { QuickLog } from "@/components/quick-log";
import { RemindersBanner } from "@/components/reminders-banner";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { VoiceLogSheet, type VoiceStart } from "@/components/voice-log-sheet";
import { useAppointments, useCycle, useEvents, useMe, usePatterns, useScore, useTips } from "@/lib/client/hooks";
import { formatIst } from "@/lib/doctors";
import { SAMPLE_MENU } from "@/lib/extraction/samples";
import { t } from "@/lib/i18n";
import { LEVEL_UI } from "@/lib/levels-ui";
import { NEXT_STEP_LABEL } from "@/lib/patterns/engine";
import type { ScoreResult } from "@/lib/scoring/engine";

function TodayInner() {
  const me = useMe();
  const score = useScore();
  const cycle = useCycle();
  const patterns = usePatterns();
  const tips = useTips();
  const appts = useAppointments();
  const events = useEvents(undefined, undefined);
  const params = useSearchParams();
  const router = useRouter();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceStart, setVoiceStart] = useState<VoiceStart>({ kind: "record" });
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const language = me.data?.language ?? "en";

  const open = (s: VoiceStart) => {
    setVoiceStart(s);
    setVoiceOpen(true);
  };

  useEffect(() => {
    const sample = params.get("sample");
    if (sample && SAMPLE_MENU.some((s) => s.id === sample)) {
      open({ kind: "sample", sampleId: sample });
      router.replace("/home");
    }
  }, [params, router]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const onSaved = (s: ScoreResult) => {
    if (s.level !== "URGENT") setToast(`Saved. Attention level: ${LEVEL_UI[s.level].label}.`);
  };

  const topCard = patterns.data?.cards.find((c) => c.nextStep !== "track") ?? patterns.data?.cards[0];
  const upcoming = appts.data?.filter((a) => a.status === "booked" && new Date(a.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const last = events.data?.[0];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-sand-600">{format(new Date(), "EEEE, d MMMM")}</p>
        <h1 className="text-2xl font-bold">{me.data ? `Hi ${me.data.name.split(" ")[0]}` : "Hi"}</h1>
      </header>

      {score.data?.level === "URGENT" && (
        <Link href="/urgent" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span className="flex-1 text-sm font-semibold">You recently logged a danger sign. Tap for what to do now.</span>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Link>
      )}

      <RemindersBanner />
      {me.data && me.data.settings.wellnessGoals.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Your wellness goals">
          {me.data.settings.wellnessGoals.map((g) => (
            <span key={g} className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">🎯 {g}</span>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardContent className="pt-5">
              {cycle.isLoading && <LoadingState label="Calculating your cycle…" />}
              {cycle.isError && <ErrorState message="Couldn't load your cycle." onRetry={() => cycle.refetch()} />}
              {cycle.data && <CycleRing est={cycle.data.estimate} />}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/timeline" className="text-sm font-semibold text-plum-600">Open calendar →</Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log today</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickLog />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log pain by voice</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <MicButton size="md" recording={false} onClick={() => open({ kind: "record" })} label={t("tapToSpeak", language)} />
              <div className="flex-1">
                <p className="font-semibold">{t("tapToSpeak", language)}</p>
                <p className="text-sm text-sand-600">{t("speakHint", language)}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button variant="outline" size="sm" onClick={() => open({ kind: "type" })}>
                    <Keyboard /> {t("typeInstead", language)}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setSamplesOpen(true)}>
                    <Play /> Sample voice note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {topCard && (
            <Link href={`/care/${topCard.id}`} className="block rounded-lg border border-amber-200 bg-amber-50 p-4 hover:border-amber-300">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
                <HeartPulse className="h-4 w-4" aria-hidden /> Health pattern · {NEXT_STEP_LABEL[topCard.nextStep]}
              </p>
              <p className="mt-1 font-semibold text-amber-950">{topCard.title}</p>
              <p className="mt-1 text-sm text-amber-900">{topCard.signals.slice(0, 2).map((s) => s.label).join(" · ")}</p>
              <p className="mt-2 text-sm font-semibold text-plum-700">Understand why →</p>
            </Link>
          )}

          <Card>
            <CardContent className="pt-4">
              {score.isLoading && <LoadingState label="Calculating your attention level…" />}
              {score.data && (
                <Link href="/insights" className="flex items-center gap-4">
                  <LevelRing score={score.data.score} level={score.data.level} size={96} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sand-600">Pain attention level</p>
                    <p className={`font-bold ${LEVEL_UI[score.data.level].text}`}>{score.data.levelMessage}</p>
                    <p className="mt-1 text-sm font-semibold text-plum-600">Why this level? →</p>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {upcoming && (
            <Link href="/appointments" className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-4 shadow-sm">
              <CalendarClock className="h-5 w-5 text-teal-600" aria-hidden />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{upcoming.doctorName}</p>
                <p className="text-sand-600">{formatIst(new Date(upcoming.startsAt))} · {upcoming.mode === "online" ? "Online" : upcoming.clinic}</p>
              </div>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Link>
          )}

          {tips.data && tips.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-teal-600" aria-hidden /> Tips for you</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {tips.data.map((tip) => (
                  <Link key={tip.slug} href={`/learn/${tip.slug}`} className="rounded-md border border-sand-200 p-3 hover:bg-sand-50">
                    <p className="font-semibold">{tip.title}</p>
                    <p className="text-sm text-sand-600">{tip.summary}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {last && (
            <section aria-label="Last pain log" className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-600">Last pain log</h2>
              <EventCard event={last} />
            </section>
          )}
        </div>
      </div>

      <Disclaimer />

      <VoiceLogSheet open={voiceOpen} start={voiceStart} language={language} cloudAi={me.data?.settings.privacy.useCloudAi ?? true} onClose={() => setVoiceOpen(false)} onSaved={onSaved} />

      <Sheet open={samplesOpen} onClose={() => setSamplesOpen(false)} title="Sample voice notes">
        <p className="mb-3 text-sm text-sand-600">Demo notes run through the same extraction and confirm steps. They work without a microphone or internet.</p>
        <div className="flex flex-col gap-2">
          {SAMPLE_MENU.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSamplesOpen(false);
                open({ kind: "sample", sampleId: s.id });
              }}
              className="flex min-h-12 items-center gap-3 rounded-md border border-sand-200 bg-white p-3 text-left hover:bg-sand-50"
            >
              <Play className="h-4 w-4 shrink-0 text-plum-600" aria-hidden />
              <span className="flex-1">
                <span className="block font-semibold">{s.label}</span>
                <span className="block truncate text-xs text-sand-600">{s.transcript}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-md bg-sand-800 p-3 text-center text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TodayInner />
    </Suspense>
  );
}
