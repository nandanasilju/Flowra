"use client";
import { useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { AlertTriangle, ChevronRight, FileText, Info, Lock } from "lucide-react";
import { CycleHeatmap, CycleLengthChart, MoodByPhase } from "@/components/cycle-charts";
import { Disclaimer } from "@/components/disclaimer";
import { LevelRing } from "@/components/level-ring";
import { PageHeader } from "@/components/page-header";
import { PainChart } from "@/components/pain-chart";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCycle, useDailyLogs, useEvents, useMe, useSummary } from "@/lib/client/hooks";
import { addDaysYmd, locateDay, ymd } from "@/lib/cycles";
import { LEVEL_UI } from "@/lib/levels-ui";
import { RED_FLAG_LABELS } from "@/lib/types";

export default function InsightsPage() {
  const me = useMe();
  const q = useSummary(30);
  const cycle = useCycle();
  const from = useMemo(() => new Date(Date.now() - 200 * 86_400_000), []);
  const events = useEvents(from, undefined);
  const logs = useDailyLogs(ymd(from), undefined);
  const plus = me.data?.plan === "plus";

  const moodByPhase = useMemo(() => {
    const cycles = cycle.data?.estimate.cycles ?? [];
    const acc: Record<string, number[]> = { Period: [], "Days 6–12": [], "Mid-cycle": [], "Week before period": [] };
    for (const l of logs.data ?? []) {
      if (l.mood === null) continue;
      const loc = locateDay(cycles, l.date);
      if (!loc) continue;
      const c = cycles[loc.index];
      if (loc.day <= c.periodDays) acc.Period.push(l.mood);
      else if (loc.daysToNext !== null && loc.daysToNext <= 7) acc["Week before period"].push(l.mood);
      else if (loc.day <= 12) acc["Days 6–12"].push(l.mood);
      else acc["Mid-cycle"].push(l.mood);
    }
    return Object.entries(acc).map(([phase, v]) => ({ phase, mood: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, n: v.length }));
  }, [logs.data, cycle.data]);

  if (q.isLoading) return <LoadingState label="Loading insights…" />;
  if (q.isError || !q.data) return <ErrorState message="Couldn't load insights." onRetry={() => q.refetch()} />;
  const { score, summary } = q.data;
  const extremeDates = new Map<string, number>();
  for (const e of score.extremeEvents) {
    const k = format(parseISO(e.occurredAt), "yyyy-MM-dd");
    extremeDates.set(k, Math.max(extremeDates.get(k) ?? 0, e.painScore));
  }
  const ui = LEVEL_UI[score.level];
  const est = cycle.data?.estimate;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Insights" subtitle="Your cycles, pain and mood over time" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cycle length</CardTitle>
          </CardHeader>
          <CardContent>
            {cycle.isLoading ? <LoadingState /> : est ? (
              <>
                <CycleLengthChart cycles={est.cycles} />
                <p className="mt-2 text-sm">
                  Average about <strong>{est.averageLength} days</strong>
                  {est.lengthRange && <> (range {est.lengthRange[0]}–{est.lengthRange[1]})</>}; period about <strong>{est.averagePeriodDays} days</strong>.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className={`${ui.bg} ${ui.border}`}>
          <CardHeader>
            <CardTitle>Pain attention level (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <LevelRing score={score.score} level={score.level} size={104} />
            <div className="min-w-0 flex-1">
              <p className={`font-bold ${ui.text}`}>{score.levelMessage}</p>
              <Link href="/insights/why" className="mt-2 inline-flex min-h-10 items-center font-semibold text-plum-600">
                Why this level? <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {score.level === "URGENT" && (
        <Link href="/urgent" className="flex items-center gap-2 rounded-lg bg-level-urgent p-3 font-semibold text-white">
          <AlertTriangle className="h-5 w-5" aria-hidden /> See what to do now
        </Link>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Pain by cycle day {!plus && <span className="inline-flex items-center gap-1 rounded-full bg-plum-50 px-2 py-0.5 text-xs text-plum-700"><Lock className="h-3 w-3" /> Plus</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          {plus ? (
            est && <CycleHeatmap cycles={est.cycles} pain={(events.data ?? []).map((e) => ({ date: ymd(new Date(e.occurredAt)), score: e.painScore }))} />
          ) : (
            <p className="text-sm text-sand-600">
              See every cycle side by side to spot pain outside your period and pain that is getting worse. <Link href="/pricing" className="font-semibold text-plum-600 underline">Activate Plus (free during beta)</Link>. Your pattern alerts in Health patterns stay free.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily pain (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.eventCount === 0 ? (
              <EmptyState title="No pain logged in the last 30 days" />
            ) : (
              <>
                <PainChart daily={summary.daily} band={score.usualBand} extremeDates={extremeDates} />
                {score.usualBand ? (
                  <p className="mt-2 text-sm text-sand-600">Your usual pain: around {score.usualBand.median}/10 (most logs between {score.usualBand.q1} and {score.usualBand.q3}).</p>
                ) : (
                  <p className="mt-2 text-sm text-teal-700">Still learning your usual pattern (needs 5 logs).</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mood across your cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodByPhase data={moodByPhase} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown score={score} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Flags and notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {score.redFlagCodes.map((c) => (
              <p key={c} className="flex items-center gap-2 text-red-800"><AlertTriangle className="h-4 w-4" aria-hidden /> {RED_FLAG_LABELS[c]} (last 48 hours)</p>
            ))}
            {score.extremeEvents.length > 0 && (
              <p><span className="font-semibold">{score.extremeEvents.length} extreme episode{score.extremeEvents.length > 1 ? "s" : ""}:</span> {score.extremeEvents.map((e) => `${format(parseISO(e.occurredAt), "d MMM")} (${e.painScore}/10)`).join(", ")}</p>
            )}
            {score.notes.map((n) => <p key={n} className="flex items-center gap-2 text-teal-700"><Info className="h-4 w-4" aria-hidden /> {n}</p>)}
            {score.redFlagCodes.length === 0 && score.extremeEvents.length === 0 && score.notes.length === 0 && <p className="text-sand-600">Nothing to flag.</p>}
            <Link href="/care" className="mt-2 font-semibold text-plum-600">See health patterns →</Link>
          </CardContent>
        </Card>
      </div>

      <Link href="/summary" className="flex min-h-12 items-center gap-3 rounded-lg border border-sand-200 bg-white p-3 font-semibold shadow-sm">
        <FileText className="h-5 w-5 text-teal-600" aria-hidden />
        <span className="flex-1">Doctor report (print / PDF / share)</span>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </Link>
      <p className="text-xs text-sand-600">Showing data since {new Date(`${addDaysYmd(ymd(from), 0)}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.</p>
      <Disclaimer />
    </div>
  );
}
