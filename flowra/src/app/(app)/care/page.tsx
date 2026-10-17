"use client";
import Link from "next/link";
import { Info, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PatternCardView } from "@/components/pattern-card";
import { ErrorState, LoadingState } from "@/components/states";
import { Card, CardContent } from "@/components/ui/card";
import { useAppointments, usePatterns } from "@/lib/client/hooks";

export default function CarePage() {
  const q = usePatterns();
  const appts = useAppointments();
  const upcoming = appts.data?.filter((a) => a.status === "booked" && new Date(a.startsAt) > new Date()).length ?? 0;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Health patterns" subtitle="Patterns in your logs that may be worth discussing with a doctor" />

      <p className="flex items-start gap-2 rounded-md bg-plum-50 p-3 text-sm text-plum-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        These are not diagnoses. Flowra compares your logs with published medical criteria and shows exactly which logs triggered each pattern. Symptoms often overlap, so several possible causes are listed. Always free.
      </p>

      {q.isLoading && <LoadingState label="Checking your patterns…" />}
      {q.isError && <ErrorState message="Couldn't check patterns." onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          {q.data.cards.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm">
                <p className="font-semibold">No patterns that need attention right now.</p>
                <p className="text-sand-600">Keep logging; Flowra checks again every time you add a log.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {q.data.cards.map((c) => <PatternCardView key={c.id} card={c} />)}
            </div>
          )}
          {q.data.dataNotes.length > 0 && (
            <div className="rounded-md border border-sand-200 bg-white p-3 text-sm text-sand-600">
              {q.data.dataNotes.map((n) => <p key={n} className="flex items-center gap-2"><Info className="h-4 w-4 text-teal-600" aria-hidden /> {n}</p>)}
            </div>
          )}
          <p className="text-xs text-sand-600">Based on {q.data.cyclesAnalysed} complete cycles and {q.data.daysLogged} logged days in the last {q.data.windowDays} days.</p>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/doctors" className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-4 font-semibold shadow-sm">
          <Stethoscope className="h-5 w-5 text-teal-600" aria-hidden /> Find a doctor
        </Link>
        <Link href="/appointments" className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-4 font-semibold shadow-sm">
          My appointments {upcoming > 0 && <span className="rounded-full bg-teal-600 px-2 text-xs text-white">{upcoming}</span>}
        </Link>
        <Link href="/urgent" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 font-semibold text-red-900">
          <Phone className="h-5 w-5" aria-hidden /> Urgent help
        </Link>
      </div>
      <p className="text-sm">
        Learn more in the <Link href="/conditions" className="font-semibold text-plum-600 underline">conditions library</Link> or read <Link href="/how-it-works" className="font-semibold text-plum-600 underline">how Flowra&apos;s AI works</Link>.
      </p>
    </div>
  );
}
