"use client";
import { cn } from "@/lib/utils";

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
  tone?: "plum" | "danger";
}

/** Toggle chip with aria-pressed; min 40px tall for comfortable tapping. */
export function Chip({ selected, onClick, children, highlight, tone = "plum" }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
        selected
          ? tone === "danger"
            ? "border-level-urgent bg-level-urgent text-white"
            : "border-plum-600 bg-plum-600 text-white"
          : "border-sand-200 bg-white text-sand-800 hover:bg-sand-50",
        highlight && !selected && "border-amber-400 bg-amber-50",
      )}
    >
      {children}
    </button>
  );
}
