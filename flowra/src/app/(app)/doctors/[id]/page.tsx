"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { qk, useDoctor } from "@/lib/client/hooks";
import { formatIst, istDate, SPECIALTY_NAMES } from "@/lib/doctors";
import type { AppointmentDTO } from "@/lib/dto";
import { formatInr } from "@/lib/utils";

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const q = useDoctor(id);
  const qc = useQueryClient();
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<"in_person" | "online" | null>(null);
  const [notes, setNotes] = useState("");
  const [share, setShare] = useState(false);
  const [accept, setAccept] = useState(false);
  const [done, setDone] = useState<{ appt: AppointmentDTO; token: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of q.data?.slots ?? []) {
      const d = istDate(new Date(s));
      m.set(d, [...(m.get(d) ?? []), s]);
    }
    return m;
  }, [q.data]);

  const book = useMutation({
    mutationFn: () =>
      apiFetch<{ appointment: AppointmentDTO; shareToken: string | null }>("/api/appointments", {
        method: "POST",
        json: { doctorId: id, startsAt: slot, mode, notes: notes.trim() || null, shareReport: share, acceptPolicy: accept },
      }),
    onSuccess: async (r) => {
      setDone({ appt: r.appointment, token: r.shareToken });
      await Promise.all([qc.invalidateQueries({ queryKey: qk.appointments }), qc.invalidateQueries({ queryKey: qk.doctor(id) }), qc.invalidateQueries({ queryKey: ["doctors"] })]);
    },
  });

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState message="Couldn't load this doctor." onRetry={() => q.refetch()} />;
  const { doctor: d, platformFeeInr, cancelPolicy } = q.data;
  const activeDay = day ?? [...byDay.keys()][0] ?? null;
  const chosenMode = mode ?? (d.modes[0] as "in_person" | "online");

  if (done) {
    const link = done.token ? `${window.location.origin}/r/${done.token}` : null;
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-teal-600" aria-hidden />
        <h1 className="text-2xl font-bold">Appointment booked</h1>
        <p>{done.appt.doctorName} · {formatIst(new Date(done.appt.startsAt))} · {done.appt.mode === "online" ? "Online" : `${done.appt.clinic}, ${done.appt.city}`}</p>
        <p className="text-sm text-sand-600">Consultation {formatInr(done.appt.feeInr)} paid at the clinic · Flowra booking fee {formatInr(done.appt.platformFeeInr)} (not charged during beta).</p>
        {d.isSample && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">This is a sample doctor profile for demonstration. No real clinic has been contacted.</p>}
        {link && (
          <div className="w-full rounded-md border border-sand-200 bg-white p-3 text-left text-sm">
            <p className="font-semibold">Your private report link for the doctor</p>
            <p className="break-all text-sand-600">{link}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { void navigator.clipboard.writeText(link); setCopied(true); }}>
              <Copy /> {copied ? "Copied" : "Copy link"}
            </Button>
            <p className="mt-2 text-xs text-sand-600">Shown only once. Expires a week after the appointment; revoke anytime in Report → Shared links.</p>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <a href={`/api/appointments/${done.appt.id}/ics`} className="inline-flex h-11 items-center rounded-md border border-sand-200 bg-white px-4 font-semibold">Add to calendar</a>
          <Link href="/appointments" className="inline-flex h-11 items-center rounded-md bg-plum-600 px-4 font-semibold text-white">My appointments</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={d.name} subtitle={`${SPECIALTY_NAMES[d.specialty as keyof typeof SPECIALTY_NAMES] ?? d.specialty} · ${d.city}`} back="/doctors" />
      <Card>
        <CardContent className="flex flex-col gap-2 pt-5 text-sm">
          <div className="flex flex-wrap gap-1">
            {d.verified && <Badge variant="teal"><BadgeCheck className="h-3 w-3" /> Registration verified</Badge>}
            {d.isSample && <Badge variant="warning">Sample profile (demo): fictional doctor</Badge>}
          </div>
          <p><strong>Qualifications:</strong> {d.qualifications}</p>
          <p><strong>Experience:</strong> {d.experienceYears} years</p>
          <p><strong>Clinic:</strong> {d.clinic}, {d.city}</p>
          <p><strong>Languages:</strong> {d.languages.join(", ")}</p>
          <p><strong>Consultation fee:</strong> {formatInr(d.feeInr)} (paid to the clinic)</p>
          {d.bio && <p className="text-sand-600">{d.bio}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Book an appointment</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <p className="mb-1 font-medium">Consultation type</p>
            <div className="flex gap-2">
              {d.modes.map((m) => <Chip key={m} selected={chosenMode === m} onClick={() => setMode(m as "in_person" | "online")}>{m === "online" ? "Online" : "In person"}</Chip>)}
            </div>
          </div>
          {byDay.size === 0 ? (
            <p className="text-sand-600">No open slots in the next 14 days.</p>
          ) : (
            <>
              <div>
                <p className="mb-1 font-medium">Day</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[...byDay.keys()].map((dd) => (
                    <Chip key={dd} selected={activeDay === dd} onClick={() => { setDay(dd); setSlot(null); }}>
                      <span className="whitespace-nowrap">{new Date(`${dd}T12:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</span>
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 font-medium">Time (IST)</p>
                <div className="flex flex-wrap gap-2">
                  {(activeDay ? byDay.get(activeDay) ?? [] : []).map((s) => (
                    <Chip key={s} selected={slot === s} onClick={() => setSlot(s)}>
                      {new Date(s).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <label htmlFor="appt-notes" className="mb-1 block font-medium">Reason for visit (optional, encrypted)</label>
            <Textarea id="appt-notes" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. severe period pain for 6 months" />
          </div>
          <label className="flex items-start gap-3 rounded-md border border-sand-200 p-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-plum-600" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span>
              <strong>Share my 90-day health report with this doctor.</strong> Creates a private, read-only link that expires a week after the appointment. You can revoke it anytime. Off by default.
            </span>
          </label>
          <div className="rounded-md bg-sand-100 p-3">
            <p className="flex justify-between"><span>Consultation fee (pay at clinic)</span><span>{formatInr(d.feeInr)}</span></p>
            <p className="flex justify-between"><span>Flowra booking fee</span><span>{formatInr(platformFeeInr)} <span className="text-xs text-teal-700">(waived during beta)</span></span></p>
            <p className="mt-1 text-xs text-sand-600">{cancelPolicy} Online payment isn&apos;t enabled yet.</p>
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-plum-600" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            <span>I understand the fees and booking policy.</span>
          </label>
          {book.isError && <p role="alert" className="rounded-md bg-red-50 p-2 text-red-800">{errorMessage(book.error)}</p>}
          <Button size="lg" disabled={!slot || !accept || book.isPending} onClick={() => book.mutate()}>
            {book.isPending && <Loader2 className="animate-spin" />} {slot ? `Book ${formatIst(new Date(slot))}` : "Pick a time"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
