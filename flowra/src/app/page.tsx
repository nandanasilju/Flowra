import Link from "next/link";
import { CalendarHeart, FileText, HeartPulse, Languages, Lock, Mic, ShieldCheck, ShoppingBag, Sparkles, Stethoscope } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: CalendarHeart, title: "Smart period tracker", text: "Calendar, predictions with an honest range, fertile-window estimates, reminders and cycle history." },
  { icon: Mic, title: "Log by voice, in your language", text: "Speak in English, हिन्दी, മലയാളം or a mix. Flowra fills in the details; you check and save." },
  { icon: HeartPulse, title: "Symptom pattern awareness", text: "Spots patterns sometimes linked with endometriosis, PCOS, PMDD, heavy bleeding and more, and explains exactly why." },
  { icon: Stethoscope, title: "Find and book a doctor", text: "Search gynaecologists by city, language, fee and online or in-person. Share your report only if you choose." },
  { icon: FileText, title: "One-page doctor report", text: "Cycle history, pain, pad chart, symptoms, your own words and questions to ask. Print or PDF." },
  { icon: Sparkles, title: "Personal self-care tips", text: "Practical guidance for cramps, bloating, mood, pad rash and more, based on what you log." },
  { icon: ShoppingBag, title: "Products that suit you", text: "Suggestions based on your preferences and comfort, with clear labels. Never based on health conditions." },
  { icon: ShieldCheck, title: "Private by design", text: "Encrypted notes, no audio stored, nothing sold. Export or delete everything anytime." },
];

export default async function Landing() {
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <section className="bg-gradient-to-b from-plum-50 to-sand-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-plum-700 shadow-sm">AI-powered menstrual health companion</p>
            <h1 className="text-4xl font-bold leading-tight text-sand-800 md:text-5xl">Your cycle, understood.</h1>
            <p className="mt-4 text-lg text-sand-600">
              Flowra tracks your periods and symptoms, notices patterns worth a doctor&apos;s attention, and helps you get care, in your own language.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={user ? "/home" : "/welcome"} className="inline-flex h-12 items-center rounded-md bg-plum-600 px-6 font-semibold text-white hover:bg-plum-700">
                {user ? "Open Flowra" : "Get started free"}
              </Link>
              {!user && (
                <Link href="/welcome?demo=1" className="inline-flex h-12 items-center rounded-md border border-sand-200 bg-white px-6 font-semibold text-sand-800 hover:bg-sand-50">
                  Try the demo
                </Link>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-sand-600">
              <Languages className="h-4 w-4 text-teal-600" aria-hidden /> English · हिन्दी · മലയാളം voice logging
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-3xl border border-sand-200 bg-white p-5 shadow-xl" aria-hidden>
            <p className="text-sm text-sand-600">Today</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-8 border-plum-200 text-center">
                <span className="text-2xl font-bold text-plum-700">Day 12</span>
              </div>
              <div>
                <p className="font-semibold">Estimated fertile window</p>
                <p className="text-sm text-sand-600">Next period in about 16 days</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">
              <p className="font-semibold text-amber-900">Pattern worth discussing</p>
              <p className="text-amber-900">Severe period pain + pain outside your period on 4 days. See why →</p>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-plum-50 p-3 text-sm text-plum-800">
              <Mic className="h-5 w-5" /> “അടിവയറ്റിൽ വേദന, പത്തിൽ ഏഴ്…”
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Everything in one place</h2>
        <p className="mt-2 max-w-2xl text-sand-600">Tracking, awareness, self-care, doctors and products, connected, so “it&apos;s just period pain” never goes unchecked.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-sand-200 bg-white p-5 shadow-sm">
              <Icon className="h-6 w-6 text-teal-600" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-sand-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold">How it works</h2>
            <p className="mt-2 text-sand-600">AI listens. Clear medical rules decide. A doctor confirms.</p>
          </div>
          <ol className="grid gap-4 md:col-span-2 md:grid-cols-2">
            {[
              ["Log in seconds", "Tap the mic or a few chips. Flow, pain, mood, sleep and symptoms."],
              ["See your patterns", "Flowra compares your history with published medical criteria, such as normal cycle ranges and heavy-bleeding scores."],
              ["Understand why", "Every alert shows the exact logs that triggered it. No scary percentages, no diagnosis."],
              ["Get the right care", "Book a doctor, share your report with consent, and get self-care tips meanwhile."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-lg border border-sand-200 p-4">
                <span className="text-sm font-bold text-plum-600">Step {i + 1}</span>
                <h3 className="font-semibold">{t}</h3>
                <p className="text-sm text-sand-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 rounded-2xl bg-plum-700 p-8 text-white md:grid-cols-[2fr_1fr] md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Endometriosis takes years to diagnose. Your record can help change that.</h2>
            <p className="mt-2 text-plum-100">The WHO estimates endometriosis affects about 10% of women of reproductive age, and pain is often dismissed as normal. Flowra turns your daily experience into evidence a doctor can act on.</p>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <Lock className="h-6 w-6" aria-hidden />
            <p className="text-sm">Your health data is never sold or used for ads.</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
