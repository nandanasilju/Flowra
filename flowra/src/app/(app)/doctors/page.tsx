"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Search, Video, Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDoctors } from "@/lib/client/hooks";
import { formatIst, SPECIALTIES, SPECIALTY_NAMES } from "@/lib/doctors";
import { formatInr } from "@/lib/utils";

function DoctorsInner() {
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState(sp.get("specialty") ?? "");
  const [mode, setMode] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [params, setParams] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (city.trim()) p.set("city", city.trim());
      if (specialty) p.set("specialty", specialty);
      if (mode) p.set("mode", mode);
      if (maxFee) p.set("maxFee", maxFee);
      setParams(p.toString());
    }, 250);
    return () => clearTimeout(id);
  }, [q, city, specialty, mode, maxFee]);

  const doctors = useDoctors(params);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Find a doctor" subtitle="Search by city, specialty, consultation type and fee" action={<Link href="/appointments" className="text-sm font-semibold text-plum-600">My appointments</Link>} />
      <div className="grid gap-2 rounded-lg border border-sand-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" aria-hidden />
          <Input aria-label="Search by name or clinic" placeholder="Name, clinic, interest…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input aria-label="City" placeholder="City (e.g. Kochi)" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select aria-label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{SPECIALTY_NAMES[s]}</option>)}
        </Select>
        <div className="flex gap-2">
          <Select aria-label="Consultation type" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">Any type</option>
            <option value="in_person">In person</option>
            <option value="online">Online</option>
          </Select>
          <Select aria-label="Maximum fee" value={maxFee} onChange={(e) => setMaxFee(e.target.value)}>
            <option value="">Any fee</option>
            <option value="500">Up to ₹500</option>
            <option value="800">Up to ₹800</option>
            <option value="1000">Up to ₹1,000</option>
          </Select>
        </div>
      </div>
      <p className="text-xs text-sand-600">Results are ordered by specialty match, verification and earliest availability. Fees and commissions never affect the order.</p>

      {doctors.isLoading && <LoadingState label="Finding doctors…" />}
      {doctors.isError && <ErrorState message="Couldn't load doctors." onRetry={() => doctors.refetch()} />}
      {doctors.data && doctors.data.length === 0 && <EmptyState title="No doctors match these filters">Try another city or consultation type.</EmptyState>}
      <div className="grid gap-3 md:grid-cols-2">
        {doctors.data?.map((d) => (
          <Link key={d.id} href={`/doctors/${d.id}`} className="flex flex-col gap-2 rounded-lg border border-sand-200 bg-white p-4 shadow-sm hover:border-plum-300">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-plum-100 text-lg font-bold text-plum-700" aria-hidden>
                {d.name.replace("Dr. ", "").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-sand-600">{SPECIALTY_NAMES[d.specialty as keyof typeof SPECIALTY_NAMES] ?? d.specialty} · {d.experienceYears} yrs</p>
                <p className="text-sm text-sand-600">{d.clinic}, {d.city}</p>
              </div>
              <p className="font-bold">{formatInr(d.feeInr)}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {d.verified ? <Badge variant="teal"><BadgeCheck className="h-3 w-3" /> Registration verified</Badge> : null}
              {d.isSample && <Badge variant="warning">Sample profile (demo)</Badge>}
              {d.modes.includes("online") && <Badge variant="neutral"><Video className="h-3 w-3" /> Online</Badge>}
              {d.modes.includes("in_person") && <Badge variant="neutral"><Building2 className="h-3 w-3" /> In person</Badge>}
              <Badge variant="neutral">{d.languages.join(", ")}</Badge>
            </div>
            <p className="text-sm">{d.nextSlot ? <>Next available: <strong>{formatIst(new Date(d.nextSlot))}</strong></> : "No slots in the next 14 days"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DoctorsInner />
    </Suspense>
  );
}
