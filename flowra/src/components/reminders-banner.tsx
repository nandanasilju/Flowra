"use client";
import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReminders } from "@/lib/client/hooks";

const SEEN_KEY = "flowra_notified_v1";

/**
 * Shows due reminders. If the user allowed browser notifications, also shows a system
 * notification once per reminder per day while Flowra is open. (Push while closed needs
 * a push service; see README roadmap.)
 */
export function RemindersBanner() {
  const q = useReminders();
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  useEffect(() => {
    if (perm !== "granted" || !q.data?.length) return;
    try {
      const today = new Date().toDateString();
      const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") as Record<string, string>;
      for (const r of q.data) {
        if (seen[r.kind] === today) continue;
        new Notification("Flowra", { body: r.text, icon: "/icons/icon-192.png" });
        seen[r.kind] = today;
      }
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {
      /* notifications or storage unavailable */
    }
  }, [perm, q.data]);

  if (!q.data?.length && perm !== "default") return null;
  return (
    <div className="flex flex-col gap-2">
      {q.data?.map((r) => (
        <div key={r.kind} className="flex items-start gap-2 rounded-lg border border-plum-100 bg-plum-50 p-3 text-sm text-plum-800" role="status">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {r.text}
        </div>
      ))}
      {perm === "default" && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={async () => {
            try {
              setPerm(await Notification.requestPermission());
            } catch {
              setPerm("unsupported");
            }
          }}
        >
          <Bell /> Turn on reminder notifications
        </Button>
      )}
    </div>
  );
}
