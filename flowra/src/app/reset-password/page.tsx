"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client/api";

function ResetInner() {
  const token = useSearchParams().get("token") ?? "";
  const [pw, setPw] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (done)
    return (
      <p role="status" className="rounded-md bg-teal-50 p-3 text-sm text-teal-700">
        Password updated. <Link href="/welcome?mode=login" className="font-semibold underline">Sign in</Link>
      </p>
    );
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          await apiFetch("/api/auth/reset", { method: "POST", json: { token, password: pw } });
          setDone(true);
        } catch (e2) {
          setErr(errorMessage(e2));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="pw" className="text-sm font-medium">New password (8+ characters)</label>
      <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required />
      <Button type="submit" disabled={busy || pw.length < 8 || !token}>{busy && <Loader2 className="animate-spin" />} Set new password</Button>
      {!token && <p className="text-sm text-red-700">This link is missing its token. Please use the link from your email.</p>}
      {err && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{err}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
      <Link href="/"><Logo /></Link>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <Suspense fallback={null}>
        <ResetInner />
      </Suspense>
    </main>
  );
}
