import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROWS: [string, string][] = [
  ["Voice recordings", "Processed in memory to create your log, then discarded. Never saved to disk, database or logs."],
  ["What goes to the cloud AI", "Only the voice note or text you're logging, sent to Google's Gemini API to transcribe and fill in fields. No name, email or history. You can turn cloud AI off in Settings; Flowra then uses on-server keyword matching."],
  ["Notes and transcripts", "Encrypted with AES-256-GCM using a key unique to you (envelope encryption with a server master key). You can also choose not to save transcripts."],
  ["Cycle and symptom data", "Stored in our database so we can calculate predictions and patterns. Protected by HTTPS (TLS) in transit and by database and hosting security. These structured fields are not separately encrypted, because the server needs to calculate with them."],
  ["Passwords", "Hashed with bcrypt. We never see or store your password."],
  ["Sessions", "Signed (HMAC-SHA256), httpOnly cookies."],
  ["Doctor sharing", "Only when you choose. You create a link that expires, can be revoked anytime, and shows a read-only report."],
  ["Shop", "Recommendations use only your product preferences, comfort symptoms (like pad irritation) and period timing, never possible conditions. Sponsored and affiliate items are labelled."],
  ["Advertising", "No ads. Your health data is never sold or used for advertising."],
  ["Your controls", "Export everything as JSON or delete your account and all data at any time from Settings."],
];

export default async function PrivacyPage() {
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy & safety</h1>
        <p className="mt-2 text-sand-600">Plain answers about what Flowra stores, what it shares, and what it doesn&apos;t. We describe only what is actually built.</p>
        <dl className="mt-8 divide-y divide-sand-200 rounded-lg border border-sand-200 bg-white">
          {ROWS.map(([k, v]) => (
            <div key={k} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-sm text-sand-600">{v}</dd>
            </div>
          ))}
        </dl>
        <h2 className="mt-10 text-xl font-bold">Medical safety</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-sand-600">
          <li>Flowra does not diagnose. Pattern cards say which logged symptoms may be worth discussing with a doctor and always list several possible causes.</li>
          <li>No invented probabilities or percentages are shown.</li>
          <li>Danger signs (fainting, soaking a pad every hour, fever with pelvic pain, sudden severe pain, non-stop vomiting) show urgent-care guidance immediately.</li>
          <li>Rules and thresholds are based on published criteria where available and are awaiting clinician review.</li>
          <li>Predictions are estimates and must not be used as contraception.</li>
        </ul>
        <p className="mt-6 text-sm text-sand-600">India&apos;s Digital Personal Data Protection Act, 2023 applies. Questions or requests: contact the Flowra team.</p>
      </div>
    </PublicShell>
  );
}
