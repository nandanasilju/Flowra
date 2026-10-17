"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { SPECIALTIES, SPECIALTY_NAMES } from "@/lib/doctors";
import type { DoctorDTO } from "@/lib/dto";
import type { ProductDTO } from "@/lib/types";

type AdminDoctor = DoctorDTO & { active: boolean };

function Doctors() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "doctors"], queryFn: () => apiFetch<{ doctors: AdminDoctor[] }>("/api/admin/doctors").then((r) => r.doctors) });
  const patch = useMutation({
    mutationFn: (b: { id: string; verified?: boolean; active?: boolean }) => apiFetch("/api/admin/doctors", { method: "PATCH", json: b }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doctors"] }),
  });
  const [f, setF] = useState({ name: "", specialty: "gynaecologist", qualifications: "", experienceYears: "5", city: "", clinic: "", languages: "English", online: true, inPerson: true, feeInr: "500", bio: "", days: "1,2,3,4,5,6", start: "10:00", end: "17:00", slotMinutes: "20" });
  const create = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/doctors", {
        method: "POST",
        json: {
          name: f.name, specialty: f.specialty, qualifications: f.qualifications, experienceYears: Number(f.experienceYears), city: f.city, clinic: f.clinic,
          languages: f.languages.split(",").map((x) => x.trim()).filter(Boolean),
          modes: [...(f.inPerson ? ["in_person"] : []), ...(f.online ? ["online"] : [])],
          feeInr: Number(f.feeInr), bio: f.bio,
          schedule: { days: f.days.split(",").map((x) => Number(x.trim())).filter((x) => x >= 0 && x <= 6), start: f.start, end: f.end, slotMinutes: Number(f.slotMinutes) },
          verified: false,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doctors"] }),
  });
  if (list.isLoading) return <LoadingState />;
  if (list.isError) return <ErrorState message={errorMessage(list.error)} />;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Add a real doctor</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Full name (Dr. …)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Select value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })}>{SPECIALTIES.map((s) => <option key={s} value={s}>{SPECIALTY_NAMES[s]}</option>)}</Select>
          <Input placeholder="Qualifications" value={f.qualifications} onChange={(e) => setF({ ...f, qualifications: e.target.value })} />
          <Input placeholder="Years of experience" type="number" value={f.experienceYears} onChange={(e) => setF({ ...f, experienceYears: e.target.value })} />
          <Input placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <Input placeholder="Clinic and area" value={f.clinic} onChange={(e) => setF({ ...f, clinic: e.target.value })} />
          <Input placeholder="Languages (comma separated)" value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} />
          <Input placeholder="Fee (₹)" type="number" value={f.feeInr} onChange={(e) => setF({ ...f, feeInr: e.target.value })} />
          <Input placeholder="Working days 0=Sun..6=Sat" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} />
          <div className="flex gap-2"><Input placeholder="Start" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /><Input placeholder="End" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /><Input placeholder="Slot min" value={f.slotMinutes} onChange={(e) => setF({ ...f, slotMinutes: e.target.value })} /></div>
          <Input className="sm:col-span-2" placeholder="Short bio" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.inPerson} onChange={(e) => setF({ ...f, inPerson: e.target.checked })} /> In person</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.online} onChange={(e) => setF({ ...f, online: e.target.checked })} /> Online</label>
          {create.isError && <p className="text-sm text-red-700 sm:col-span-2">{errorMessage(create.error)}</p>}
          <Button className="sm:col-span-2" disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending && <Loader2 className="animate-spin" />} Add doctor (unverified)</Button>
          <p className="text-xs text-sand-600 sm:col-span-2">Mark “verified” only after checking the doctor&apos;s registration with the State Medical Council / National Medical Commission register.</p>
        </CardContent>
      </Card>
      {list.data?.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sand-200 bg-white p-3 text-sm">
          <div>
            <p className="font-semibold">{d.name} {d.isSample && <Badge variant="warning">Sample</Badge>}</p>
            <p className="text-sand-600">{SPECIALTY_NAMES[d.specialty as keyof typeof SPECIALTY_NAMES] ?? d.specialty} · {d.city} · ₹{d.feeInr}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">Verified <Switch checked={d.verified} onCheckedChange={(v) => patch.mutate({ id: d.id, verified: v })} aria-label="Verified" /></span>
            <span className="flex items-center gap-2">Active <Switch checked={d.active} onCheckedChange={(v) => patch.mutate({ id: d.id, active: v })} aria-label="Active" /></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Products() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "products"], queryFn: () => apiFetch<{ products: ProductDTO[] }>("/api/admin/products").then((r) => r.products) });
  const [edits, setEdits] = useState<Record<string, { url: string; retailer: string }>>({});
  const patch = useMutation({
    mutationFn: (b: Partial<ProductDTO> & { id: string }) => apiFetch("/api/admin/products", { method: "PATCH", json: b }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
  if (list.isLoading) return <LoadingState />;
  if (list.isError) return <ErrorState message={errorMessage(list.error)} />;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-sand-600">Replace search links with verified product-specific (or affiliate) links. Mark affiliate/sponsored honestly: users see these labels. Ranking never uses them.</p>
      {patch.isError && <p className="text-sm text-red-700">{errorMessage(patch.error)}</p>}
      {list.data?.map((p) => {
        const e = edits[p.id] ?? { url: p.url, retailer: p.retailer };
        return (
          <div key={p.id} className="flex flex-col gap-2 rounded-lg border border-sand-200 bg-white p-3 text-sm">
            <p className="font-semibold">{p.emoji} {p.name} {p.linkVerified ? <Badge variant="teal">Verified link</Badge> : <Badge variant="warning">Search link</Badge>}</p>
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
              <Input aria-label="Product URL" value={e.url} onChange={(ev) => setEdits({ ...edits, [p.id]: { ...e, url: ev.target.value } })} />
              <Input aria-label="Retailer" value={e.retailer} onChange={(ev) => setEdits({ ...edits, [p.id]: { ...e, retailer: ev.target.value } })} />
              <Button size="sm" onClick={() => patch.mutate({ id: p.id, url: e.url, retailer: e.retailer, linkVerified: true })}>Save as verified</Button>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2">Affiliate <Switch checked={p.affiliate} onCheckedChange={(v) => patch.mutate({ id: p.id, affiliate: v })} aria-label="Affiliate" /></span>
              <span className="flex items-center gap-2">Sponsored <Switch checked={p.sponsored} onCheckedChange={(v) => patch.mutate({ id: p.id, sponsored: v })} aria-label="Sponsored" /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<"doctors" | "products">("doctors");
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader title="Admin" subtitle="Doctors and product links" back="/profile" />
      <div className="flex gap-2">
        <Button variant={tab === "doctors" ? "default" : "outline"} onClick={() => setTab("doctors")}>Doctors</Button>
        <Button variant={tab === "products" ? "default" : "outline"} onClick={() => setTab("products")}>Products</Button>
      </div>
      {tab === "doctors" ? <Doctors /> : <Products />}
    </div>
  );
}
