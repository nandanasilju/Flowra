"use client";
import { format, parseISO } from "date-fns";
import { PainChart } from "@/components/pain-chart";
import type { Report } from "@/lib/report-service";
import { LEVEL_UI } from "@/lib/levels-ui";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-card rounded-md border border-sand-200 bg-white p-3">
      <p className="text-xs text-sand-600">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="print-card rounded-md border border-sand-200 bg-white p-3">
    <h2 className="mb-2 font-semibold">{title}</h2>
    {children}
  </section>
);

/** The one-page doctor report (also used for consent-based shared links). */
export function ReportView({ report: r }: { report: Report }) {
  const s = r.summary;
  const extremeDates = new Map<string, number>();
  for (const e of s.extremeEpisodes) {
    const k = format(parseISO(e.occurredAt), "yyyy-MM-dd");
    extremeDates.set(k, Math.max(extremeDates.get(k) ?? 0, e.painScore));
  }
  return (
    <article className="flex flex-col gap-4">
      <header className="print-card rounded-md border border-sand-200 bg-white p-3">
        <p className="text-lg font-bold">Flowra health report: {r.patientName}</p>
        <p className="text-sm text-sand-600">
          {format(parseISO(s.from), "d MMM yyyy")} to {format(parseISO(s.to), "d MMM yyyy")} ({s.days} days) · generated {format(parseISO(r.generatedAt), "d MMM yyyy, h:mm a")}
        </p>
        <p className="mt-1 text-sm">
          Pain attention level (last 30 days): <span className={`font-semibold ${LEVEL_UI[r.score.level].text}`}>{LEVEL_UI[r.score.level].label}</span>, score {r.score.score}/100
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Average cycle" value={`${r.cycle.averageLength} days`} />
        <Stat label="Cycle range" value={r.cycle.lengthRange ? `${r.cycle.lengthRange[0]}–${r.cycle.lengthRange[1]} d` : "–"} />
        <Stat label="Average period" value={`${r.cycle.averagePeriodDays} days`} />
        <Stat label="Pain days (4+/10)" value={String(s.painDays)} />
        <Stat label="Extreme pain episodes" value={String(s.extremeEpisodes.length)} />
        <Stat label="Pain days outside period" value={s.outsidePeriodShare === null ? "No data" : `${Math.round(s.outsidePeriodShare * 100)}%`} />
        <Stat label="Missed activities" value={String(s.missedActivityCount)} />
        <Stat label="Days in bed" value={String(s.bedBoundCount)} />
      </section>

      {r.patterns.length > 0 && (
        <Section title="Patterns noted (not a diagnosis)">
          <ul className="space-y-2 text-sm">
            {r.patterns.map((p) => (
              <li key={p.id}>
                <p className="font-semibold">{p.title} <span className="font-normal text-sand-600">· possibly related: {p.conditions.map((c) => c.name).join(", ")}</span></p>
                <ul className="list-disc pl-5 text-sand-800">{p.signals.map((sg) => <li key={sg.id}>{sg.label}: {sg.evidence}</li>)}</ul>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Cycles">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-sand-200 text-sand-600"><th className="py-1 font-medium">Start</th><th className="py-1 font-medium">Cycle length</th><th className="py-1 font-medium">Bleeding days</th><th className="py-1 font-medium">Pad-chart score</th></tr></thead>
          <tbody>
            {r.cycle.cycles.map((c) => (
              <tr key={c.start} className="border-b border-sand-100">
                <td className="py-1">{format(parseISO(c.start), "d MMM yyyy")}</td>
                <td className="py-1">{c.length ?? "current"}</td>
                <td className="py-1">{c.periodDays}</td>
                <td className="py-1">{c.pbac === null ? "–" : `${c.pbac}${c.pbac >= 100 ? " (heavy)" : ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Daily maximum pain">
        {s.eventCount === 0 ? <p className="text-sm text-sand-600">No pain logs in this period.</p> : <PainChart daily={s.daily} band={r.score.usualBand} extremeDates={extremeDates} animate={false} />}
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Most logged symptoms">
          {r.topSymptoms.length === 0 ? <p className="text-sm text-sand-600">None logged.</p> : (
            <ul className="text-sm">{r.topSymptoms.map((t) => <li key={t.code} className="flex justify-between"><span>{t.label}</span><span>{t.days} days</span></li>)}</ul>
          )}
        </Section>
        <Section title="Medicines and relief">
          {s.medications.length === 0 ? <p className="text-sm text-sand-600">No medicines logged.</p> : (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-sand-200 text-sand-600"><th className="py-1 font-medium">Medicine</th><th className="py-1 font-medium">Times</th><th className="py-1 font-medium">None</th><th className="py-1 font-medium">Partial</th><th className="py-1 font-medium">Full</th></tr></thead>
              <tbody>{s.medications.map((m) => <tr key={m.name} className="border-b border-sand-100"><td className="py-1">{m.name}</td><td className="py-1">{m.timesTaken}</td><td className="py-1">{m.none}</td><td className="py-1">{m.partial}</td><td className="py-1">{m.full}</td></tr>)}</tbody>
            </table>
          )}
        </Section>
      </div>

      {r.quotes.length > 0 && (
        <Section title="In her own words">
          <ul className="space-y-2 text-sm">
            {r.quotes.map((q) => (
              <li key={q.date}>
                <p className="italic">“{q.text}”</p>
                {q.english && q.english !== q.text && <p className="text-sand-600">English: {q.english}</p>}
                <p className="text-xs text-sand-600">{format(parseISO(q.date), "d MMM yyyy")}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {r.questions.length > 0 && (
        <Section title="Questions to discuss">
          <ol className="list-decimal space-y-1 pl-5 text-sm">{r.questions.map((q) => <li key={q}>{q}</li>)}</ol>
        </Section>
      )}

      <Section title="Danger signs mentioned">
        {s.redFlags.length === 0 ? <p className="text-sm text-sand-600">None.</p> : <ul className="text-sm">{s.redFlags.map((f) => <li key={f.code}>{f.label}: {f.count} time{f.count > 1 ? "s" : ""}</li>)}</ul>}
      </Section>

      <footer className="border-t border-sand-200 pt-2 text-center text-xs text-sand-600">
        Patient-reported documentation aid generated by Flowra. Not a diagnostic device. Pattern thresholds follow published criteria where available and await clinician review.
      </footer>
    </article>
  );
}
