"use client";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  recording: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  size?: "lg" | "md";
}

/** The hero microphone button: plum circle, pulse rings while recording. */
export function MicButton({ recording, onClick, disabled, label, size = "lg" }: MicButtonProps) {
  const dim = size === "lg" ? "h-36 w-36" : "h-24 w-24";
  return (
    <div className={cn("relative flex items-center justify-center", dim)}>
      {recording && (
        <>
          <span className="absolute inset-0 animate-pulsering rounded-full bg-plum-500" aria-hidden />
          <span className="absolute inset-0 animate-pulsering rounded-full bg-plum-300 [animation-delay:0.7s]" aria-hidden />
        </>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={recording}
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full text-white shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-plum-300 active:scale-95 disabled:opacity-50",
          dim,
          recording ? "bg-level-urgent" : "bg-gradient-to-br from-plum-500 to-plum-700",
        )}
      >
        {recording ? <Square className={size === "lg" ? "h-12 w-12" : "h-8 w-8"} fill="currentColor" /> : <Mic className={size === "lg" ? "h-14 w-14" : "h-9 w-9"} />}
      </button>
    </div>
  );
}

export function formatElapsed(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
