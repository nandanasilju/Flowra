/**
 * Extraction evaluation: runs tests/utterances.json through the same extractor
 * the app uses (Gemini if GEMINI_API_KEY is set, otherwise the offline keyword
 * extractor) and prints a per-field accuracy table.
 *
 * Usage: npm run eval:extraction
 * Note: utterances are sent as typed text (no audio files are bundled).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { runExtraction } from "../src/lib/extraction";
import type { Language } from "../src/lib/enums";
import type { Extraction } from "../src/lib/extraction/schema";

// Minimal .env loader (no extra dependency).
const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

interface Expected {
  painScore?: number | null;
  descriptors?: string[];
  locations?: string[];
  isPeriodDay?: boolean | null;
  bleeding?: string | null;
  functionalImpact?: string | null;
  associated?: string[];
  medications?: string[];
  redFlags?: string[];
}

interface Utterance {
  id: string;
  language: Language;
  text: string;
  expected: Expected;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
const containsAll = (got: string[], want: string[]) => want.every((x) => got.includes(x));

function check(field: keyof Expected, want: Expected[keyof Expected], x: Extraction): boolean {
  switch (field) {
    case "painScore":
      return x.painScore === want;
    case "isPeriodDay":
      return x.isPeriodDay === want;
    case "bleeding":
      return x.bleeding === want;
    case "functionalImpact":
      return x.functionalImpact === want;
    case "descriptors":
      return containsAll(x.descriptors, want as string[]);
    case "locations":
      return containsAll(x.locations, want as string[]);
    case "associated":
      return containsAll(x.associated, want as string[]);
    case "medications":
      return containsAll(x.medications.map((m) => m.name.toLowerCase()), (want as string[]).map((s) => s.toLowerCase()));
    case "redFlags":
      return sameSet(x.redFlagsMentioned, want as string[]);
    default:
      return false;
  }
}

async function main() {
  const file = path.join(process.cwd(), "tests", "utterances.json");
  const { utterances } = JSON.parse(readFileSync(file, "utf8")) as { utterances: Utterance[] };
  const stats = new Map<string, { ok: number; total: number }>();
  const failures: string[] = [];
  let engine = "";

  for (const u of utterances) {
    let res;
    try {
      res = await runExtraction({ text: u.text, language: u.language, followUpCount: 0 });
    } catch (e) {
      failures.push(`${u.id}: extraction failed (${e instanceof Error ? e.message : "error"})`);
      continue;
    }
    engine = res.engine;
    for (const [field, want] of Object.entries(u.expected) as [keyof Expected, Expected[keyof Expected]][]) {
      const s = stats.get(field) ?? { ok: 0, total: 0 };
      s.total++;
      if (check(field, want, res.extracted)) s.ok++;
      else failures.push(`${u.id}.${field}: expected ${JSON.stringify(want)}`);
      stats.set(field, s);
    }
  }

  console.log(`\nExtraction eval · engine: ${engine || "n/a"} · ${utterances.length} utterances\n`);
  console.log("Field              Correct   Accuracy");
  console.log("-----------------  --------  --------");
  let ok = 0;
  let total = 0;
  for (const [field, s] of [...stats.entries()].sort()) {
    ok += s.ok;
    total += s.total;
    console.log(`${field.padEnd(17)}  ${`${s.ok}/${s.total}`.padEnd(8)}  ${((s.ok / s.total) * 100).toFixed(0).padStart(6)}%`);
  }
  console.log("-----------------  --------  --------");
  console.log(`${"ALL FIELDS".padEnd(17)}  ${`${ok}/${total}`.padEnd(8)}  ${total ? ((ok / total) * 100).toFixed(0).padStart(6) : "0"}%`);
  if (failures.length) {
    console.log("\nMisses:");
    for (const f of failures) console.log(`  - ${f}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
