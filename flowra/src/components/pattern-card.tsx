import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PatternCard as Card } from "@/lib/patterns/engine";
import { NEXT_STEP_LABEL } from "@/lib/patterns/engine";
import { cn } from "@/lib/utils";

const TONE: Record<Card["nextStep"], string> = {
  track: "border-teal-200 bg-teal-50",
  consult: "border-amber-200 bg-amber-50",
  consult_soon: "border-orange-300 bg-orange-50",
  urgent: "border-red-300 bg-red-50",
};

export function PatternCardView({ card }: { card: Card }) {
  return (
    <Link href={`/care/${card.id}`} className={cn("block rounded-lg border p-4 hover:shadow-md", TONE[card.nextStep])}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sand-600">
            {NEXT_STEP_LABEL[card.nextStep]} · {card.strength === "strong" ? "Several signs" : "Some signs"}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{card.title}</h2>
          <p className="mt-1 text-sm">Possibly related: {card.conditions.map((c) => c.name).join(", ")}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-sand-800">
            {card.signals.slice(0, 3).map((s) => <li key={s.id}>{s.label}</li>)}
          </ul>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0" aria-hidden />
      </div>
    </Link>
  );
}
