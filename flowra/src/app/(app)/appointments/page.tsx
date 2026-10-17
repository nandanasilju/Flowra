"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { qk, useAppointments, useDoctor } from "@/lib/client/hooks";
import { formatIst } from "@/lib/doctors";
import type { AppointmentDTO } from "@/lib/dto";
import { formatInr } from "@/lib/utils";

function Reschedule({ appt, onDone }: { appt: AppointmentDTO; onDone: () => void }) {
  const q = useDoctor(appt.doctorId);
  const qc = useQueryClient();
  const [slot, setSlot] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => apiFetch("/api/appointments", { method: "PATCH", json: { action: "reschedule", id: appt.id, startsAt: slot } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.appointments });
      onDone();
    },
  });
  if (q.isLoading) return <LoadingState />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
        {(q.data?.slots ?? []).slice(0, 40).map((s) => <Chip key={s} selected={slot === s} onClick={() => setSlot(s)}>{formatIst(new Date(s))}</Chip>)}
      </div>
      {m.isError && <p role="alert" className="text-sm text-red-700">{errorMessage(m.error)}</p>}
      <Button disabled={!slot || m.isPending} onClick={() => m.mutate()}>{m.isPending && <Loader2 className="animate-spin" />} Confirm new time</Button>
    </div>
  );
}

export default function AppointmentsPage() {
  const q = useAppointments();
  const qc = useQueryClient();
  const [moving, setMoving] = useState<AppointmentDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const cancel = useMutation({
    mutationFn: (id: string) => apiFetch("/api/appointments", { method: "PATCH", json: { action: "cancel", id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.appointments }),
    onError: (e) => setErr(errorMessage(e)),
  });
  const now = Date.now();
  const upcoming = (q.data ?? []).filter((a) => a.status === "booked" && new Date(a.startsAt).getTime() > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = (q.data ?? []).filter((a) => !upcoming.includes(a));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title="My appointments" back="/doctors" />
      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState message="Couldn't load appointments." onRetry={() => q.refetch()} />}
      {err && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">{err}</p>}
      {q.data && q.data.length === 0 && (
        <EmptyState title="No appointments yet"><Link href="/doctors" className="font-semibold text-plum-600 underline">Find a doctor</Link></EmptyState>
      )}
      {upcoming.length > 0 && <h2 className="font-semibold">Upcoming</h2>}
      {upcoming.map((a) => (
        <article key={a.id} className="rounded-lg border border-sand-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{a.doctorName}</p>
              <p className="text-sm text-sand-600">{formatIst(new Date(a.startsAt))} · {a.mode === "online" ? "Online" : `${a.clinic}, ${a.city}`}</p>
              <p className="text-sm text-sand-600">Fee {formatInr(a.feeInr)} at clinic{a.reportShared ? " · report shared" : ""}</p>
            </div>
            {a.isSampleDoctor && <Badge variant="warning">Sample doctor</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`/api/appointments/${a.id}/ics`} className="inline-flex h-9 items-center gap-1 rounded-md border border-sand-200 px-3 text-sm font-semibold"><CalendarPlus className="h-4 w-4" /> Add to calendar</a>
            <Button size="sm" variant="outline" onClick={() => setMoving(a)}>Reschedule</Button>
            <Button size="sm" variant="ghost" className="text-red-700" disabled={cancel.isPending} onClick={() => window.confirm("Cancel this appointment?") && cancel.mutate(a.id)}>Cancel</Button>
          </div>
        </article>
      ))}
      {past.length > 0 && <h2 className="mt-2 font-semibold">Past and cancelled</h2>}
      {past.map((a) => (
        <article key={a.id} className="rounded-lg border border-sand-200 bg-white p-4 text-sm opacity-80">
          <p className="font-semibold">{a.doctorName}</p>
          <p className="text-sand-600">{formatIst(new Date(a.startsAt))} · {a.status === "cancelled" ? "Cancelled" : a.status === "completed" ? "Completed" : "Past"}</p>
        </article>
      ))}
      <Sheet open={moving !== null} onClose={() => setMoving(null)} title="Pick a new time">
        {moving && <Reschedule appt={moving} onDone={() => setMoving(null)} />}
      </Sheet>
    </div>
  );
}
