import { Info } from "lucide-react";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs text-sand-600 ${className}`}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        Flowra is a tracking and health-awareness tool, not a diagnosis. Predictions are estimates and not contraception. Some thresholds still need clinician review.
        If you are worried, contact a doctor. Emergency: 112 · Tele-MANAS: 14416.
      </span>
    </p>
  );
}
