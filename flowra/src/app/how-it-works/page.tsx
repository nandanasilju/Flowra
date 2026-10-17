import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";
import { PROFILE_RULES } from "@/lib/patterns/profiles";

export const dynamic = "force-dynamic";

export default async function HowItWorks() {
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">How Flowra&apos;s AI works</h1>
        <p className="mt-2 text-sand-600">A hybrid system: AI understands what you say; transparent, testable rules make every health-related decision.</p>

        <h2 className="mt-8 text-xl font-bold">1. Understanding your words (generative AI)</h2>
        <p className="mt-2 text-sm text-sand-600">
          Voice notes and typed notes are sent to Google&apos;s Gemini model with a strict JSON schema. It transcribes (in the original script), translates to English and fills fields such as pain score, location and medicines. Every answer is validated, and you confirm every field before anything is saved. If the AI is unavailable or turned off, an on-server keyword extractor in English, Hindi and Malayalam is used instead.
        </p>

        <h2 className="mt-8 text-xl font-bold">2. Cycle predictions (statistics)</h2>
        <p className="mt-2 text-sm text-sand-600">
          Next period = weighted average of your last 6 cycle lengths (recent cycles count more), shown with a range based on how much your cycles vary. Ovulation is estimated 14 days before the next period and the fertile window from 5 days before to 1 day after. These are estimates, not contraception.
        </p>

        <h2 className="mt-8 text-xl font-bold">3. Pattern awareness (knowledge-based expert system)</h2>
        <p className="mt-2 text-sm text-sand-600">
          Flowra turns your last {PROFILE_RULES.windowDays} days into signals (for example, &ldquo;cycles longer than 38 days in 2 of 4 cycles&rdquo;) and matches them against condition profiles built from published criteria:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sand-600">
          <li>Normal cycle limits (FIGO 2018): {PROFILE_RULES.cycleMin}–{PROFILE_RULES.cycleMax} days, variation ≤ 7–9 days, bleeding ≤ {PROFILE_RULES.periodMaxDays} days.</li>
          <li>Heavy bleeding: Pictorial Blood loss Assessment Chart score of {PROFILE_RULES.pbacHeavy}+ per period (Higham et al., 1990).</li>
          <li>Premenstrual patterns: symptoms in the week before the period that ease after it starts, in at least {PROFILE_RULES.minPmCycles} cycles.</li>
          <li>Other thresholds (e.g. severe pain = 7+/10) are placeholders awaiting clinician review.</li>
        </ul>
        <p className="mt-2 text-sm text-sand-600">
          Why rules and not a trained classifier? No public dataset links daily symptom diaries to doctor-confirmed diagnoses across these conditions, and a model trained on the wrong data would look accurate while being wrong, a well-known source of bias in medical AI. Rules are explainable: every card shows the exact logs that triggered it, lists overlapping conditions, and never shows a probability.
        </p>

        <h2 className="mt-8 text-xl font-bold">4. Research: a symptoms-only PCOS model</h2>
        <p className="mt-2 text-sm text-sand-600">
          The project includes a training pipeline (scikit-learn: logistic regression, random forest, gradient boosting; 5-fold cross-validation; calibration; feature importance) for a public PCOS dataset collected from hospitals in Kerala, using only features a person can self-report. It is a research prototype: it is not used in the app until it has been validated with clinicians.
        </p>

        <h2 className="mt-8 text-xl font-bold">5. Safety rules</h2>
        <p className="mt-2 text-sm text-sand-600">Danger signs in the last 48 hours always show urgent-care guidance (112), regardless of any score, and no products are shown on that screen.</p>
      </article>
    </PublicShell>
  );
}
