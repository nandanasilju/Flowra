"use client";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Cycle } from "@/lib/cycles";
import { diffDays, NORMAL_CYCLE_MAX, NORMAL_CYCLE_MIN } from "@/lib/cycles";
import { painColor } from "@/lib/levels-ui";

function short(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Cycle lengths with the typical 24–38 day range shaded (FIGO). */
export function CycleLengthChart({ cycles }: { cycles: Cycle[] }) {
  const data = cycles.filter((c) => c.length !== null).slice(-8).map((c) => ({ label: short(c.start), length: c.length as number, period: c.periodDays }));
  if (data.length === 0) return <p className="text-sm text-sand-600">Log at least two period start dates to see cycle lengths.</p>;
  return (
    <div role="img" aria-label="Cycle length per cycle with the typical range shaded">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#F4EEE8" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B6159" }} tickLine={false} />
          <YAxis domain={[0, (max: number) => Math.max(45, max + 5)]} tick={{ fontSize: 11, fill: "#6B6159" }} tickLine={false} axisLine={false} />
          <ReferenceArea y1={NORMAL_CYCLE_MIN} y2={NORMAL_CYCLE_MAX} fill="#0E7C86" fillOpacity={0.1} />
          <Tooltip formatter={(v) => [`${String(v)} days`, "Cycle length"]} />
          <Bar dataKey="length" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.length < NORMAL_CYCLE_MIN || d.length > NORMAL_CYCLE_MAX ? "#C2410C" : "#7A45AE"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-sand-600">Shaded band: typical range of 24–38 days. Orange bars fall outside it.</p>
    </div>
  );
}

/** Pain by cycle day, one row per cycle: makes cyclical vs acyclical pain visible at a glance. */
export function CycleHeatmap({ cycles, pain }: { cycles: Cycle[]; pain: { date: string; score: number }[] }) {
  const rows = cycles.slice(-6);
  if (rows.length === 0) return <p className="text-sm text-sand-600">Log your periods to see this view.</p>;
  const maxDay = Math.min(45, Math.max(28, ...rows.map((c) => c.length ?? 28)));
  const painByDate = new Map<string, number>();
  for (const p of pain) painByDate.set(p.date, Math.max(painByDate.get(p.date) ?? 0, p.score));
  return (
    <div className="overflow-x-auto" role="img" aria-label="Pain by cycle day for your recent cycles">
      <table className="border-separate border-spacing-0.5 text-[10px]">
        <thead>
          <tr>
            <th className="pr-2 text-left font-normal text-sand-600">Cycle</th>
            {Array.from({ length: maxDay }, (_, i) => (
              <th key={i} className="w-4 font-normal text-sand-600">{(i + 1) % 7 === 1 ? i + 1 : ""}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.start}>
              <td className="whitespace-nowrap pr-2 text-sand-600">{short(c.start)}</td>
              {Array.from({ length: maxDay }, (_, i) => {
                const len = c.length ?? diffDays(new Date().toISOString().slice(0, 10), c.start) + 1;
                if (i >= len) return <td key={i} />;
                const d = new Date(`${c.start}T12:00:00`);
                d.setDate(d.getDate() + i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const p = painByDate.get(key);
                const isPeriod = i < c.periodDays;
                return (
                  <td
                    key={i}
                    title={`${key}${p !== undefined ? ` · pain ${p}/10` : ""}${isPeriod ? " · period" : ""}`}
                    className={`h-4 w-4 rounded-sm ${isPeriod ? "ring-1 ring-plum-300" : ""}`}
                    style={{ backgroundColor: p !== undefined ? painColor(p) : "#F4EEE8", opacity: p !== undefined ? 0.35 + p / 15 : 1 }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-sand-600">Each row is a cycle; outlined cells are period days. Colour shows the highest pain you logged that day. Pain far from the outlined cells is pain outside your period.</p>
    </div>
  );
}

/** Average mood by cycle phase (from daily logs). */
export function MoodByPhase({ data }: { data: { phase: string; mood: number | null; n: number }[] }) {
  const rows = data.filter((d) => d.mood !== null);
  if (rows.length === 0) return <p className="text-sm text-sand-600">Log your mood on a few days to see how it changes across your cycle.</p>;
  return (
    <div role="img" aria-label="Average mood by cycle phase">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#F4EEE8" vertical={false} />
          <XAxis dataKey="phase" tick={{ fontSize: 11, fill: "#6B6159" }} tickLine={false} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#6B6159" }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v, _n, item) => [`${Number(v).toFixed(1)} / 5 (${(item.payload as { n: number }).n} days)`, "Average mood"]} />
          <Bar dataKey="mood" fill="#0E7C86" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { painColor };
