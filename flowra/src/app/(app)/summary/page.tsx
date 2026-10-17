"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Loader2, Lock, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ReportView } from "@/components/report-view";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { apiFetch, ApiError, errorMessage } from "@/lib/client/api";
import { qk, useMe, useShareLinks, useSummary } from "@/lib/client/hooks";

const RANGES = [30, 60, 90] as const;

function ShareLinks({ plus }: { plus: boolean }) {
  const links = useShareLinks();
  const qc = useQueryClient();
  const [label, setLabel] = useState("For my gynaecologist");
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => apiFetch<{ token: string }>("/api/share-links", { method: "POST", json: { label, days, validDays: 7, consent } }),
    onSuccess: async (r) => {
      setToken(r.token);
      await qc.invalidateQueries({ queryKey: qk.shareLinks });
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/share-links?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shareLinks }),
  });
  const url = token ? `${window.location.origin}/r/${token}` : null;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>Create a private, read-only link to your report. It expires in 7 days and you can revoke it anytime. Only share it with people you trust.</p>
      <label htmlFor="sl-label" className="font-medium">Label</label>
      <Input id="sl-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Button key={r} size="sm" variant={days === r ? "default" : "outline"} disabled={r > 30 && !plus} onClick={() => setDays(r)}>{r} days{r > 30 && !plus ? " (Plus)" : ""}</Button>
        ))}
      </div>
      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-plum-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I want to share my health report through this link.
      </label>
      {create.isError && <p role="alert" className="text-red-700">{errorMessage(create.error)}</p>}
      <Button disabled={!consent || !label.trim() || create.isPending} onClick={() => create.mutate()}>{create.isPending && <Loader2 className="animate-spin" />} Create link</Button>
      {url && (
        <div className="rounded-md bg-teal-50 p-3">
          <p className="break-all font-mono text-xs">{url}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => void navigator.clipboard.writeText(url)}><Copy /> Copy</Button>
          <p className="mt-1 text-xs text-teal-700">Shown only once. Copy it now.</p>
        </div>
      )}
      <h3 className="mt-2 font-semibold">Your links</h3>
      {links.isLoading && <LoadingState />}
      {links.data?.length === 0 && <p className="text-sand-600">None yet.</p>}
      {links.data?.map((l) => {
        const expired = new Date(l.expiresAt) < new Date();
        return (
          <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-sand-200 p-2">
            <div>
              <p className="font-medium">{l.label}</p>
              <p className="text-xs text-sand-600">{l.days} days · {l.revoked ? "revoked" : expired ? "expired" : `expires ${new Date(l.expiresAt).toLocaleDateString("en-IN")}`} · viewed {l.views}×</p>
            </div>
            {!l.revoked && !expired && <Button size="sm" variant="ghost" className="text-red-700" onClick={() => revoke.mutate(l.id)}>Revoke</Button>}
          </div>
        );
      })}
    </div>
  );
}

export default function SummaryPage() {
  const me = useMe();
  const plus = me.data?.plan === "plus";
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [shareOpen, setShareOpen] = useState(false);
  const q = useSummary(days);
  const needsPlus = q.error instanceof ApiError && q.error.status === 402;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader
        title="Doctor report"
        subtitle="A one-page record to show your doctor."
        back="/insights"
        action={
          <div className="no-print flex gap-2">
            <Button variant="outline" onClick={() => setShareOpen(true)}><Link2 /> Share</Button>
            <Button onClick={() => window.print()} disabled={!q.data}><Printer /> Print / PDF</Button>
          </div>
        }
      />
      <div role="group" aria-label="Period covered" className="no-print grid grid-cols-3 gap-2">
        {RANGES.map((r) => (
          <Button key={r} variant={days === r ? "default" : "outline"} onClick={() => setDays(r)} aria-pressed={days === r}>
            {r} days {r > 30 && !plus && <Lock className="h-3 w-3" aria-label="Plus" />}
          </Button>
        ))}
      </div>
      {q.isLoading && <LoadingState label="Preparing report…" />}
      {needsPlus && (
        <p className="rounded-md bg-plum-50 p-3 text-sm text-plum-800">
          60 and 90-day reports are part of Flowra Plus. <Link href="/pricing" className="font-semibold underline">Activate Plus (free during beta)</Link>
        </p>
      )}
      {q.isError && !needsPlus && <ErrorState message="Couldn't build the report." onRetry={() => q.refetch()} />}
      {q.data && <ReportView report={q.data} />}
      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Share with a doctor">
        <ShareLinks plus={plus} />
      </Sheet>
    </div>
  );
}
