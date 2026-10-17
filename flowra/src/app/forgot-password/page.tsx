"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
      <Link href="/"><Logo /></Link>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            const r = await apiFetch<{ message: string }>("/api/auth/forgot", { method: "POST", json: { email } });
            setMsg(r.message);
          } catch (e2) {
            setErr(errorMessage(e2));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" disabled={busy || !email}>{busy && <Loader2 className="animate-spin" />} Send reset link</Button>
      </form>
      {msg && <p role="status" className="rounded-md bg-teal-50 p-3 text-sm text-teal-700">{msg}</p>}
      {err && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      <Link href="/welcome?mode=login" className="text-sm font-semibold text-plum-600">Back to sign in</Link>
    </main>
  );
}
