import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { EMERGENCY_NUMBER_IN, LEVEL_INFO } from "@/lib/scoring/constants";

/**
 * URGENT screen. Full-screen, calm, no navigation bar, and deliberately NO shop
 * content or promotions of any kind.
 */
export default function UrgentPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 bg-white px-5 py-10">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-level-urgent">Please act now</p>
        <h1 className="text-2xl font-bold leading-snug text-sand-800">{LEVEL_INFO.URGENT.message}</h1>
        <p className="text-sand-600">
          You don&apos;t need to be sure. If you fainted, are bleeding very heavily, have a fever with this pain, sudden very severe pain, or can&apos;t stop
          vomiting, getting checked quickly is the safe choice. If you can, ask someone to stay with you.
        </p>
      </div>

      <a
        href={`tel:${EMERGENCY_NUMBER_IN}`}
        className="flex min-h-16 items-center justify-center gap-3 rounded-lg bg-level-urgent px-4 text-xl font-bold text-white shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
      >
        <Phone className="h-6 w-6" aria-hidden /> Call {EMERGENCY_NUMBER_IN}
      </a>

      <a
        href="https://www.google.com/maps/search/gynaecologist+near+me"
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 items-center justify-center gap-3 rounded-lg border-2 border-teal-600 px-4 text-lg font-semibold text-teal-700"
      >
        <MapPin className="h-5 w-5" aria-hidden /> Find a doctor near me
      </a>

      <p className="text-sm text-sand-600">
        Flowra is not a diagnosis. This screen appears because of what you described, not because of a score.
      </p>

      <Link href="/home" className="mt-auto text-center font-semibold text-plum-600 underline-offset-4 hover:underline">
        Back to Flowra
      </Link>
    </main>
  );
}
