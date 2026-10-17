import { format } from "date-fns";
import { AlertTriangle, Pencil, Pill, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { painColor } from "@/lib/levels-ui";
import { LABELS, RED_FLAG_LABELS, type PainEventDTO } from "@/lib/types";

interface EventCardProps {
  event: PainEventDTO;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function EventCard({ event: e, onEdit, onDelete, deleting }: EventCardProps) {
  return (
    <article className="rounded-lg border border-sand-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full text-white"
          style={{ backgroundColor: painColor(e.painScore) }}
          aria-label={`Pain ${e.painScore} out of 10`}
        >
          <span className="text-lg font-bold leading-none">{e.painScore}</span>
          <span className="text-[10px] leading-none">/10</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{format(new Date(e.occurredAt), "EEE d MMM, h:mm a")}</p>
          <p className="text-sm text-sand-600">
            {[...e.descriptors.map((d) => LABELS.descriptors[d]), ...e.locations.map((l) => LABELS.locations[l])].join(" · ") || "No details"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {e.isPeriodDay && <Badge>Period day</Badge>}
            {e.functionalImpact !== "none" && <Badge variant="neutral">Impact: {LABELS.impacts[e.functionalImpact]}</Badge>}
            {e.missedActivity && <Badge variant="warning">Missed activity</Badge>}
            {e.bedBound && <Badge variant="warning">In bed</Badge>}
            {e.medications.map((m, i) => (
              <Badge key={`${m.name}-${i}`} variant="teal">
                <Pill className="h-3 w-3" aria-hidden /> {m.name}: {LABELS.relief[m.relief]}
              </Badge>
            ))}
            {e.redFlags.map((f) => (
              <Badge key={f} variant="danger">
                <AlertTriangle className="h-3 w-3" aria-hidden /> {RED_FLAG_LABELS[f]}
              </Badge>
            ))}
            {e.source === "sample" && <Badge variant="neutral">Sample</Badge>}
          </div>
          {e.transcript && e.transcript !== "(Sample data)" && <p className="mt-2 line-clamp-2 text-sm italic text-sand-600">“{e.transcript}”</p>}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-2 flex justify-end gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" className="text-red-700" onClick={onDelete} disabled={deleting}>
              <Trash2 /> Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
