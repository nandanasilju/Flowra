"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Database, Loader2, Mic, Stethoscope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { LABELS, LANGUAGES, type Language } from "@/lib/types";
import { GOALS, GOAL_LABELS, type Goal } from "@/lib/enums";
import { Chip } from "@/components/ui/chip";

const POINTS = [
  {
    icon: Database,
    title: "What we store",
    text: "Only the details you confirm (pain score, symptoms, notes) and the text of what you said. Audio recordings are never stored.",
  },
  {
    icon: Mic,
    title: "What goes to the AI service",
    text: "Your voice note or typed text is sent to Google's Gemini service only to turn it into text and fields. We don't send your name, email or past logs. You can turn this off in Settings.",
  },
  {
    icon: Stethoscope,
    title: "Not a diagnosis",
    text: "Flowra tracks your cycle and may point out symptom patterns worth discussing with a doctor. It never diagnoses, and predictions are estimates (not contraception). In an emergency call 112.",
  },
  {
    icon: Trash2,
    title: "You're in control",
    text: "Notes are encrypted. Export all your data or delete your account at any time. Your health data is never sold, and possible conditions are never used to target products.",
  },
];

export function ConsentClient({ name, initialLanguage }: { name: string; initialLanguage: Language }) {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [agreed, setAgreed] = useState(false);
  const [goal, setGoal] = useState<Goal>("track");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/account", { method: "PATCH", json: { consent: true, language, goal, settings: { showFertility: goal === "conceive" || goal === "track", reminders: { fertileWindow: goal === "conceive" } } } });
      router.replace("/home");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold text-plum-700">Hi {name.split(" ")[0]}, before you start</h1>
      <p className="text-sand-600">Please read how Flowra handles your information.</p>

      <div className="flex flex-col gap-3">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <CardContent className="flex gap-3 pt-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" aria-hidden />
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-sand-600">{text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">What would you like Flowra to help with?</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Your goal">
          {GOALS.map((g) => (
            <Chip key={g} selected={goal === g} onClick={() => setGoal(g)}>
              {GOAL_LABELS[g]}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-sand-600">This sets your home screen and reminders. You can change it anytime.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lang" className="text-sm font-semibold">
          Language for prompts and follow-up questions
        </label>
        <Select id="lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {LABELS.languages[l]}
            </option>
          ))}
        </Select>
        <p className="text-xs text-sand-600">You can always speak in any mix of English, Hindi and Malayalam.</p>
      </div>

      <label className="flex min-h-12 items-start gap-3 rounded-md border border-sand-200 bg-white p-3">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-plum-600" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span className="text-sm">I understand Flowra does not diagnose and its predictions are estimates, and I agree to my notes being processed (audio is never stored) to create my logs.</span>
      </label>

      {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      <Button size="lg" disabled={!agreed || saving} onClick={accept}>
        {saving ? <Loader2 className="animate-spin" /> : <Check />} Agree and continue
      </Button>
    </main>
  );
}
