"use client";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { ErrorState, LoadingState } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScore } from "@/lib/client/hooks";
import { LEVEL_UI } from "@/lib/levels-ui";
import {
  EXTREME_ABSOLUTE,
  EXTREME_RELATIVE_DELTA,
  EXTREME_RELATIVE_MIN,
  FLOOR_ORANGE_EXTREMES,
  LEVEL_INFO,
  LEVEL_ORDER,
  RED_FLAG_CODES,
  RED_FLAG_LABELS,
  RED_FLAG_LOOKBACK_HOURS,
  WINDOW_DAYS,
} from "@/lib/scoring/constants";

export default function WhyPage() {
  const q = useScore();
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Couldn't load the score." onRetry={() => q.refetch()} />;
  const s = q.data;
  const ui = LEVEL_UI[s.level];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Why this level?" subtitle={`Calculated by fixed rules from your last ${WINDOW_DAYS} days. No AI is used for the score.`} back="/insights" />

      <Card className={`${ui.bg} ${ui.border}`}>
        <CardContent className="pt-4">
          <p className={`text-lg font-bold ${ui.text}`}>
            {ui.label}: score {s.score}/100
          </p>
          <p className="text-sm">{s.levelMessage}</p>
          {s.floorApplied && <p className="mt-1 text-sm">The score alone gives {LEVEL_UI[s.baseLevel].label}; extreme episodes raise it to {LEVEL_UI[s.floorApplied].label}.</p>}
          {s.redFlag && <p className="mt-1 text-sm font-semibold">A danger sign in the last {RED_FLAG_LOOKBACK_HOURS} hours overrides the score.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What contributed</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {s.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points by part</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreBreakdown score={s} showDetail />
        </CardContent>
      </Card>

      {s.extremeEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extreme episodes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {s.extremeEvents.map((e) => (
                <li key={e.id}>
                  <span className="font-semibold">{format(parseISO(e.occurredAt), "d MMM, h:mm a")}</span>: {e.painScore}/10 · {e.reasons.join(", ")}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How the rules work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-sand-600">
          <ul className="space-y-1">
            {LEVEL_ORDER.map((l) => (
              <li key={l}>
                <span className={`font-semibold ${LEVEL_UI[l].text}`}>{LEVEL_INFO[l].title}</span> ({LEVEL_INFO[l].range}): {LEVEL_INFO[l].message}
              </li>
            ))}
          </ul>
          <p>
            An extreme episode is pain of {EXTREME_ABSOLUTE}+ out of 10, or at least {EXTREME_RELATIVE_DELTA} points above your usual level (and {EXTREME_RELATIVE_MIN}+), or any
            danger sign. One extreme episode means at least Yellow; {FLOOR_ORANGE_EXTREMES} or more means at least Orange.
          </p>
          <p>Danger signs that show urgent advice: {RED_FLAG_CODES.map((c) => RED_FLAG_LABELS[c].toLowerCase()).join("; ")}.</p>
          <p className="rounded-md bg-amber-50 p-2 text-amber-900">All thresholds are placeholders and still require clinician review. This is not a diagnosis.</p>
        </CardContent>
      </Card>
    </div>
  );
}
