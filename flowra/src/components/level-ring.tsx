import type { Level } from "@/lib/scoring/constants";
import { LEVEL_UI } from "@/lib/levels-ui";

/** Circular gauge showing the Attention Score (0–100) in the level colour. */
export function LevelRing({ score, level, size = 132 }: { score: number; level: Level; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const ui = LEVEL_UI[level];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Attention score ${score} of 100, level ${ui.label}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F4EEE8" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ui.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-sand-800">{score}</span>
        <span className={`text-xs font-bold uppercase tracking-wide ${ui.text}`}>{ui.label}</span>
      </div>
    </div>
  );
}
