import { redirect } from "next/navigation";
import { AppHeader, BottomNav } from "@/components/bottom-nav";
import { getSessionUser } from "@/lib/auth";
import { parseSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Signed-in area: requires a session and accepted consent. Applies accessibility settings. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/welcome");
  if (!user.consentAt) redirect("/consent");
  const a = parseSettings(user.settings).accessibility;
  return (
    <div className={`${a.largeText ? "text-[1.0625rem] [&_.text-sm]:text-base [&_.text-xs]:text-sm" : ""} ${a.reduceMotion ? "reduce-motion" : ""} ${a.highContrast ? "high-contrast" : ""}`}>
      <AppHeader />
      {user.isDemo && <div className="no-print bg-teal-600 px-4 py-1 text-center text-xs font-semibold text-white">Demo account · sample data</div>}
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 lg:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}
