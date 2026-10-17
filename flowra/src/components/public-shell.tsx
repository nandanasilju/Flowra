import Link from "next/link";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/learn", label: "Learn" },
  { href: "/conditions", label: "Conditions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
];

/** Header + footer for public pages (landing, learn, conditions, pricing, privacy). */
export function PublicShell({ children, signedIn = false }: { children: React.ReactNode; signedIn?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sand-50">
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/" aria-label="Flowra home">
            <Logo />
          </Link>
          <nav aria-label="Site" className="hidden flex-1 gap-1 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-sand-600 hover:bg-sand-100 hover:text-sand-800">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Link href="/home" className="inline-flex h-10 items-center rounded-md bg-plum-600 px-4 text-sm font-semibold text-white hover:bg-plum-700">
                Open Flowra
              </Link>
            ) : (
              <>
                <Link href="/welcome?mode=login" className="hidden h-10 items-center rounded-md px-3 text-sm font-semibold text-plum-700 hover:bg-plum-50 sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/welcome" className="inline-flex h-10 items-center rounded-md bg-plum-600 px-4 text-sm font-semibold text-white hover:bg-plum-700">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
        <nav aria-label="Site (mobile)" className="flex gap-1 overflow-x-auto border-t border-sand-100 px-2 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap px-3 py-2 text-sm text-sand-600">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-sand-600 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-2">Your cycle, understood. Built in India for every stage of life.</p>
          </div>
          <div className="flex flex-col gap-1">
            <Link href="/learn" className="hover:text-sand-800">Learn</Link>
            <Link href="/conditions" className="hover:text-sand-800">Conditions library</Link>
            <Link href="/how-it-works" className="hover:text-sand-800">How Flowra's AI works</Link>
            <Link href="/privacy" className="hover:text-sand-800">Privacy & safety</Link>
            <Link href="/urgent" className="font-semibold text-level-urgent hover:underline">Urgent help (112)</Link>
          </div>
          <p className="text-xs">
            Flowra is a tracking and health-awareness tool. It does not diagnose, treat or replace a doctor. Predictions are estimates and not contraception. In an emergency call 112. Mental-health support: Tele-MANAS 14416.
          </p>
        </div>
      </footer>
    </div>
  );
}
