"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/client/api";

export function UpgradeButton({ current }: { current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plus = current === "plus";
  const change = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/account", { method: "PATCH", json: { plan: plus ? "free" : "plus" } });
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <Button className="w-full" variant={plus ? "outline" : "default"} onClick={change} disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} {plus ? "Plus is active · switch back to Free" : "Activate Plus (free during beta)"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
