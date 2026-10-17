import { COMPONENT_KEYS } from "@/lib/scoring/constants";
import type { ScoreResult } from "@/lib/scoring/engine";

/** Horizontal bars, one per score component (points / max). */
export function ScoreBreakdown({ score, showDetail = false }: { score: ScoreResult; showDetail?: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {COMPONENT_KEYS.map((k) => {
        const c = score.components[k];
        const pct = c.max ? (c.points / c.max) * 100 : 0;
        return (
          <li key={k}>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{c.label}</span>
              <span className="tabular-nums text-sand-600">
                {c.points} / {c.max}
              </span>
            </div>
            <div
              className="mt-1 h-2.5 overflow-hidden rounded-full bg-sand-100"
              role="progressbar"
              aria-label={c.label}
              aria-valuemin={0}
              aria-valuemax={c.max}
              aria-valuenow={c.points}
            >
              <div className="h-full rounded-full bg-plum-600" style={{ width: `${pct}%` }} />
            </div>
            {showDetail && <p className="mt-1 text-xs text-sand-600">{c.detail}</p>}
          </li>
        );
      })}
    </ul>
  );
}
