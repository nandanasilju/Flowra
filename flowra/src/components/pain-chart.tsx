"use client";
import { format, parseISO } from "date-fns";
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import type { UsualBand } from "@/lib/scoring/engine";

interface Point {
  date: string;
  maxPain: number | null;
  period: boolean;
}

interface PainChartProps {
  daily: Point[];
  band: UsualBand | null;
  extremeDates: Map<string, number>;
  height?: number;
  animate?: boolean;
}

/** Daily max pain with the personal "usual band" (IQR) shaded and extreme episodes marked. */
export function PainChart({ daily, band, extremeDates, height = 220, animate = true }: PainChartProps) {
  const data = daily.map((d) => ({
    label: format(parseISO(d.date), "d MMM"),
    pain: d.maxPain,
    extreme: extremeDates.has(d.date) ? extremeDates.get(d.date) ?? null : null,
    period: d.period ? 0.4 : null,
  }));
  const tickEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div role="img" aria-label="Daily maximum pain chart with your usual range shaded">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#F4EEE8" vertical={false} />
          <XAxis dataKey="label" interval={tickEvery - 1} tick={{ fontSize: 11, fill: "#6B6159" }} tickLine={false} />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: "#6B6159" }} tickLine={false} axisLine={false} />
          {band && <ReferenceArea y1={band.q1} y2={band.q3 === band.q1 ? band.q1 + 0.3 : band.q3} fill="#0E7C86" fillOpacity={0.12} ifOverflow="extendDomain" />}
          {band && <ReferenceLine y={band.median} stroke="#0E7C86" strokeDasharray="4 4" />}
          <Tooltip
            formatter={(value, name) => [`${String(value)}/10`, name === "extreme" ? "Extreme episode" : "Max pain"]}
            labelStyle={{ fontWeight: 600 }}
          />
          <Scatter dataKey="period" fill="#B48ED9" shape="square" isAnimationActive={false} legendType="none" tooltipType="none" />
          <Line type="monotone" dataKey="pain" stroke="#5B2A86" strokeWidth={2} dot={{ r: 3, fill: "#5B2A86" }} connectNulls isAnimationActive={animate} />
          <Scatter dataKey="extreme" fill="#B42318" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-sand-600" aria-hidden>
        <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-plum-600" /> Max pain per day</span>
        {band && <span className="flex items-center gap-1"><span className="h-3 w-4 bg-teal-600/20" /> Your usual range</span>}
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-level-urgent" /> Extreme episode</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-plum-300" /> Period day</span>
      </div>
    </div>
  );
}
