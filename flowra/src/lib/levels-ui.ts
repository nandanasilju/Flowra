import type { Level } from "./scoring/constants";

/** Visual tokens for each level (text colours meet WCAG AA on white). */
export const LEVEL_UI: Record<Level, { color: string; text: string; bg: string; border: string; label: string }> = {
  GREEN: { color: "#1B7F5A", text: "text-level-green", bg: "bg-emerald-50", border: "border-emerald-200", label: "Green" },
  YELLOW: { color: "#946200", text: "text-level-yellow", bg: "bg-amber-50", border: "border-amber-200", label: "Yellow" },
  ORANGE: { color: "#C2410C", text: "text-level-orange", bg: "bg-orange-50", border: "border-orange-200", label: "Orange" },
  URGENT: { color: "#B42318", text: "text-level-urgent", bg: "bg-red-50", border: "border-red-200", label: "Urgent" },
};

/** Colour for a 0–10 pain score (calendar dots, chart points). */
export function painColor(score: number): string {
  if (score >= 7) return "#B42318";
  if (score >= 4) return "#C2410C";
  if (score >= 1) return "#0E7C86";
  return "#A69A8E";
}
