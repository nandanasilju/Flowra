import type { CycleEstimate } from "@/lib/cycles";
import { PHASE_LABEL } from "@/lib/cycles";

const PHASE_COLOR: Record<string, string> = {
  period: "#B42318",
  follicular: "#0E7C86",
  fertile: "#7A45AE",
  luteal: "#946200",
  late: "#C2410C",
};

function fmt(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Cycle ring: current cycle day and phase, with the next-period estimate as a range. */
export function CycleRing({ est }: { est: CycleEstimate }) {
  if (!est.cycleDay || !est.phase) {
    return (
      <div className="text-center">
        <p className="font-semibold">Log your last period to start predictions</p>
        <p className="text-sm text-sand-600">Open Calendar and tap the day it started.</p>
      </div>
    );
  }
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(est.cycleDay / Math.max(est.averageLength, 1), 1);
  const color = PHASE_COLOR[est.phase];
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`Cycle day ${est.cycleDay} of about ${est.averageLength}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F4EEE8" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-sand-600">Cycle day</span>
          <span className="text-3xl font-bold">{est.cycleDay}</span>
        </div>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-lg font-bold" style={{ color }}>{PHASE_LABEL[est.phase]}</p>
        {est.nextPeriod && (
          <p className="text-sm">
            {est.lateByDays > 0 ? (
              <>Period is <strong>{est.lateByDays} days</strong> later than estimated</>
            ) : (
              <>Next period around <strong>{fmt(est.nextPeriod.date)}</strong> (likely {fmt(est.nextPeriod.earliest)}–{fmt(est.nextPeriod.latest)})</>
            )}
          </p>
        )}
        {est.fertileWindow && (
          <p className="text-sm text-sand-600">Estimated fertile window {fmt(est.fertileWindow.start)}–{fmt(est.fertileWindow.end)}</p>
        )}
        <p className="mt-1 text-xs text-sand-600">
          Estimates based on {est.cycles.filter((x) => x.length).length} cycle{est.cycles.filter((x) => x.length).length === 1 ? "" : "s"} · confidence {est.confidence}. Not contraception.
        </p>
      </div>
    </div>
  );
}
