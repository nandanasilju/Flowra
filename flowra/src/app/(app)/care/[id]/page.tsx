"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, BookOpen, FileText, LineChart, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatterns } from "@/lib/client/hooks";
import { getCondition } from "@/lib/content/conditions";
import { getArticle } from "@/lib/content/learn";
import { NEXT_STEP_LABEL, SPECIALTY_LABEL } from "@/lib/patterns/engine";
import { cn } from "@/lib/utils";

type Tab = "understand" | "track" | "consult" | "report";
const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "understand", label: "Understand your symptoms", icon: BookOpen },
  { id: "track", label: "Track this pattern", icon: LineChart },
  { id: "consult", label: "Consult a doctor", icon: Stethoscope },
  { id: "report", label: "View my health report", icon: FileText },
];

export default function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = usePatterns();
  const [tab, setTab] = useState<Tab>("understand");
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Couldn't load this pattern." onRetry={() => q.refetch()} />;
  const card = q.data.cards.find((c) => c.id === id);
  if (!card) {
    return (
      <div className="flex flex-col gap-3">
        <PageHeader title="Pattern not active" back="/care" />
        <p className="text-sm text-sand-600">This pattern no longer appears in your recent logs.</p>
      </div>
    );
  }
  const specialty = card.specialties[0];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={card.title} subtitle={`${NEXT_STEP_LABEL[card.nextStep]} · ${card.strength === "strong" ? "several signs" : "some signs"}`} back="/care" />

      {card.nextStep === "urgent" && (
        <Link href="/urgent" className="flex items-center gap-2 rounded-lg bg-level-urgent p-3 font-semibold text-white">
          <AlertTriangle className="h-5 w-5" aria-hidden /> Seek urgent care now
        </Link>
      )}

      <p className="rounded-lg border border-sand-200 bg-white p-4">{card.summary}</p>
      {card.safetyNote && <p role="note" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{card.safetyNote}</p>}

      <div role="tablist" aria-label="Next steps" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map(({ id: t, label, icon: Icon }) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center text-xs font-semibold", tab === t ? "border-plum-600 bg-plum-50 text-plum-700" : "border-sand-200 bg-white text-sand-800")}>
            <Icon className="h-5 w-5" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {tab === "understand" && (
        <Card>
          <CardHeader><CardTitle>Why you&apos;re seeing this</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ul className="space-y-2">
              {card.signals.map((s) => (
                <li key={s.id} className="rounded-md bg-sand-100 p-3">
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-sand-600">{s.evidence}</p>
                </li>
              ))}
            </ul>
            <p className="font-semibold">Conditions that can cause this pattern</p>
            <ul className="space-y-1">
              {card.conditions.map((c) => {
                const info = getCondition(c.slug);
                return (
                  <li key={c.name}>
                    <Link href={`/conditions/${c.slug}`} className="font-semibold text-plum-600 underline">{c.name}</Link>
                    {info && <span className="text-sand-600">: {info.short}</span>}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-sand-600">These symptoms do not confirm a diagnosis. Only a doctor can find the cause.</p>
          </CardContent>
        </Card>
      )}

      {tab === "track" && (
        <Card>
          <CardHeader><CardTitle>Keep tracking</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>{card.nextStepText}</p>
            <p>What helps most for this pattern:</p>
            <ul className="list-disc pl-5">
              {card.signals.some((s) => s.id === "heavy") && <li>Use the pad chart in the daily log for your next full period.</li>}
              {card.signals.some((s) => s.id.startsWith("pm_")) && <li>Log mood every day for two cycles, including good days.</li>}
              {card.signals.some((s) => ["severe_period_pain", "acyclical", "period_pain"].includes(s.id)) && <li>Log pain with the mic whenever it happens, including outside your period.</li>}
              <li>Log your period start and end dates.</li>
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/log" className="inline-flex h-10 items-center rounded-md bg-plum-600 px-4 font-semibold text-white">Log today</Link>
              <Link href="/insights" className="inline-flex h-10 items-center rounded-md border border-sand-200 px-4 font-semibold">See my charts</Link>
            </div>
            {card.tips.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold">Self-care meanwhile</p>
                <ul className="mt-1 space-y-1">
                  {card.tips.map((slug) => {
                    const a = getArticle(slug);
                    return a ? <li key={slug}><Link href={`/learn/${slug}`} className="text-plum-600 underline">{a.title}</Link></li> : null;
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "consult" && (
        <Card>
          <CardHeader><CardTitle>See the right doctor</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>Suggested: {card.specialties.map((s) => SPECIALTY_LABEL[s]).join(" or ")}.</p>
            <Link href={`/doctors?specialty=${specialty}`} className="inline-flex h-11 items-center justify-center rounded-md bg-plum-600 px-4 font-semibold text-white">
              Find a {SPECIALTY_LABEL[specialty].toLowerCase()}
            </Link>
            <Link href="/learn/doctor-visit" className="text-plum-600 underline">How to prepare for the visit</Link>
          </CardContent>
        </Card>
      )}

      {tab === "report" && (
        <Card>
          <CardHeader><CardTitle>Your health report</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>A one-page summary with your cycles, pain, bleeding, symptoms, this pattern and questions to ask. Print it, save as PDF, or share a private link with your doctor.</p>
            <Link href="/summary" className="inline-flex h-11 items-center justify-center rounded-md bg-plum-600 px-4 font-semibold text-white">Open my report</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
