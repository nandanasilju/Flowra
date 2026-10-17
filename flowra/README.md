# Flowra · Your cycle, understood

Flowra is an AI-powered period tracker and menstrual health companion, built as a responsive website (installable as a PWA). Women can track their cycles, log symptoms by **voice in English, Hindi, Malayalam or a mix**, see **explainable symptom patterns** sometimes linked with menstrual conditions, get **personalised self-care tips**, **find and book doctors**, share a **one-page report** with consent, and discover **suitable menstrual products**.

> Flowra does not diagnose. Pattern cards point out logged symptoms worth discussing with a doctor and always list several possible causes. Predictions are estimates, not contraception. Thresholds without a published source are marked for clinician review.

---

## Quick start (local)

Requirements: Node.js 18.18+ (20 LTS recommended).

```bash
cp .env.example .env
npm run gen:keys            # paste the two printed lines into .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev                 # http://localhost:3000
```

Open http://localhost:3000. Use **Try the demo** on the home page, or sign in with:

| Login (password `demo1234`) | What it shows |
|---|---|
| `demo@flowra.app` (Anjali) | Severe period pain + pain outside the period + heavy bleeding → endometriosis-linked, heavy-bleeding and anaemia pattern cards; Orange pain level |
| `riya@flowra.app` (Riya) | Long cycles (42–43 days) + acne + extra hair growth → PCOS-linked pattern |
| `mild@flowra.app` (Meera) | Typical cycles; only a "keep tracking" card |

Other commands:

```bash
npm test                  # 85 unit tests (cycles, patterns, scoring, extraction, recommendations, doctors, settings)
npm run typecheck
npm run eval:extraction   # voice/text extraction accuracy on 15 EN/HI/ML utterances
npm run build && npm start
```

Admin: set `ADMIN_EMAILS="you@example.com"` in `.env`, sign up with that email, then open **Profile → Admin** to add real doctors and replace product links.

---

## Features

| Area | What's included |
|---|---|
| **Website** | Landing page, Learn library (14 topics), Conditions library (11 conditions + symptom matrix), Pricing, Privacy & safety, How Flowra's AI works, Urgent help. Responsive: top navigation on desktop, bottom tabs on phones. |
| **Accounts** | Email + password (bcrypt), signed httpOnly session, password reset by email (Resend), rate-limited login/registration, consent + goal onboarding, demo account. |
| **Period tracker** | Calendar with logged periods, predicted periods (dashed), estimated fertile window (can be hidden), daily-log markers; period start/end; next-period estimate with a range and confidence; cycle day and phase; late-period notice. |
| **Daily logging** | Flow, pad & tampon chart (PBAC score), mood, energy, sleep, 38 symptoms in 7 groups, custom symptoms, encrypted notes; one-tap quick log on Today. |
| **Voice logging** | Mic (60 s), Gemini transcription + translation + field extraction with a strict JSON schema; Web Speech fallback; typed fallback; follow-up question for a missing pain score; confirm-before-save; sample notes that work offline. |
| **Pattern awareness** | Rule-based engine for endometriosis, adenomyosis, fibroids, PCOS, PMS, PMDD, primary/secondary dysmenorrhea, heavy/abnormal bleeding, iron-deficiency anaemia, irregular/missed periods and pelvic infection warning signs. Each card: why (exact logs), overlapping conditions, next step (track / consult / soon / urgent) and four actions: Understand · Track · Consult a doctor · View report. |
| **Pain attention level** | 0–100 score from 6 tested components, Green/Yellow/Orange, "Why this level?", red-flag override to an urgent screen (112). |
| **Insights** | Cycle-length chart with the typical 24–38-day band, pain-by-cycle-day heatmap (Plus), daily pain chart with personal usual band, mood by cycle phase, score breakdown. |
| **Doctors** | Search by name, city, specialty, online/in-person, max fee; profiles; 14-day IST slot booking; transparent fees + booking fee + policy; optional consent-based report sharing; reschedule, cancel, add to calendar (.ics); reminders. Ranking never uses fees or commission. |
| **Reports** | One-page doctor report (30 days free; 60/90 with Plus): cycles table with pad-chart scores, patterns, pain chart, symptoms, medicines and relief, the patient's own words, questions to ask. Print/PDF. Expiring, revocable share links with view counts. |
| **Self-care** | Personalised tips on Today from logged symptoms and active patterns; each article has what to try, precautions, when to see a doctor, references. |
| **Shop** | 15 products (no medicines), personalised suggestions with reasons ("You logged pad irritation…"), dismiss, retailer links, Sponsored/Affiliate labels, cart, Care Kit builder, demo checkout, orders, period-ready reminder. |
| **Personalisation** | Goals, language, reminders (period soon, daily log, fertile window, appointments; in-app + browser notifications while open), quick-symptom shortcuts, custom symptoms, wellness goals, product preferences, accessibility (larger text, reduce motion, higher contrast), privacy toggles. |
| **Plans** | Free and Plus (₹99/month hypothesis). Payments not live: Plus is free to activate during beta. Safety and pattern features are never paywalled. |
| **Privacy** | Audio never stored; per-user AES-256-GCM encryption of notes/transcripts (envelope encryption); option to turn off cloud AI or transcript saving; export everything (JSON); delete account (cascade + key destruction). |
| **Admin** | Add real doctors, mark verified after registration checks, deactivate; replace product search links with verified/affiliate links. |
| **Research** | `research/pcos/`: scikit-learn pipeline for a symptoms-only PCOS model (Kaggle Kerala dataset), not used by the app. |

---

## Architecture

```
Browser (Next.js 14 App Router · React 18 · Tailwind · TanStack Query · Recharts)
  Public site ── /, /learn, /conditions, /pricing, /privacy, /how-it-works, /urgent
  App ────────── /home /log /timeline /insights /care /doctors /appointments /summary /shop /profile /admin
  Shared report  /r/[token] (read-only, expiring, revocable)
        │ JSON over HTTPS (zod-validated)
Next.js route handlers (Node runtime)
  auth · account · daily-logs · pain-events · periods · cycle · patterns · score · summary
  voice/extract ──► Gemini (audio/text in memory → JSON) ──► zod ──► confirm card
  doctors · appointments(.ics) · share-links · products · recommendations · orders · admin
        │
Pure engines (no I/O, unit-tested)
  cycles.ts (predictions) · patterns/ (condition patterns) · scoring/ (attention level)
  shop/recommend.ts · doctors.ts (slots, ranking) · summary.ts
        │
Prisma ORM ── SQLite (local) / PostgreSQL (production)
  Free-text fields encrypted with per-user keys (crypto.ts, ENCRYPTION_KEY master key)
```

### Algorithms

| Job | Method |
|---|---|
| Speech → structured log | Gemini (Flash) with system prompt + JSON response schema; zod validation; offline keyword extractor (EN/HI/ML) fallback |
| Next period | Weighted mean of last 6 cycle lengths (recent weighted more); range from cycle variation; confidence from count + variation |
| Ovulation / fertile window | Next period − 14 days; window −5 to +1 days (estimate only) |
| Condition patterns | Knowledge-based expert system: signals from FIGO 2018 cycle limits, PBAC ≥ 100 (Higham 1990), premenstrual timing across ≥ 2 cycles, plus placeholder thresholds; profiles combine signals into cards with "some/several signs" (no percentages) |
| Pain attention level | 6 weighted components (intensity P90, frequency, impact, pain outside period, trend, medicine response), personal baseline (median + IQR), floors and red-flag override |
| Recommendations | Relevance scoring from preferences, comfort symptoms and cycle timing; deterministic, commission-blind ordering |
| Doctor ranking | Specialty match → verification → earliest slot → experience (never fee) |
| Research model | Logistic regression, random forest, gradient boosting; stratified 5-fold CV; isotonic calibration; permutation importance |

### Security

TLS in transit (your host) · bcrypt passwords · HMAC-SHA256 signed httpOnly cookies · AES-256-GCM field encryption with per-user data keys wrapped by `ENCRYPTION_KEY` · SHA-256-hashed share/reset tokens · rate limiting (in-memory) · zod validation on every input · no request bodies logged · `Permissions-Policy` limits the mic to this site · API responses never cached by the service worker.

---

## Deploy for real users

1. **Database:** create a PostgreSQL database (e.g. Neon, Supabase or Railway). In `prisma/schema.prisma` set `provider = "postgresql"`, set `DATABASE_URL`, delete any `prisma/migrations` folder and run `npx prisma migrate dev --name init` once (or `npx prisma db push`).
2. **Host:** deploy to Vercel (or any Node host). Set env vars: `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY` (back it up safely), `GEMINI_API_KEY`, `GEMINI_MODEL`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS`, `SHOW_SAMPLE_DOCTORS=false`.
3. **Seed products:** run `npm run seed` once against the production DB (it also creates the 3 demo logins; delete them afterwards if you don't want them).
4. **Doctors:** add real doctors in /admin and verify their registration before marking them verified.
5. **Product links:** replace search links with verified product or affiliate links in /admin.
6. Use HTTPS (required for the microphone).

**Before launching publicly** (not code, but required): clinician review of the pattern thresholds and wording; a privacy policy and terms reviewed under India's DPDP Act 2023; agreements with clinics for bookings; affiliate programme sign-up; a paid Gemini tier (check Google's data-use terms).

---

## What's real and what's not (please read)

| Item | Status |
|---|---|
| Tracking, predictions, logging, patterns, reports, share links, settings, export/delete | Fully working |
| Voice extraction | Working with a Gemini key; sample notes and keyword fallback work without one |
| Doctors | Booking system works; the 11 seeded doctors are **fictional sample profiles**, clearly labelled. No clinic is contacted. |
| Payments | Not live. Consultation is "pay at clinic"; booking fee shown but waived; Plus free during beta; shop checkout is a demo |
| Product links | Seeded as retailer **search** links, labelled "Search on…", until replaced with verified links |
| Notifications | In-app + browser notifications while Flowra is open; push when closed needs a push service (roadmap) |
| Encryption | Free-text fields encrypted; structured fields (dates, scores, symptom codes) are protected by DB/host security, not field-encrypted |
| Clinical validation | Not done. Thresholds from published criteria where available; others are placeholders |
| Trained ML model | Research pipeline only (`research/pcos`); not used in the app |

---

## Project structure

```
prisma/schema.prisma, prisma/seed.ts
public/            manifest, service worker, icons
research/pcos/     PCOS model training pipeline + README
scripts/           eval-extraction.ts, gen-keys.mjs
src/app/           public pages, (app) pages, api routes, r/[token]
src/components/    UI components (ui/ = shadcn-style primitives)
src/lib/           cycles, patterns/, scoring/, extraction/, content/, shop/, doctors, crypto, report-service, ...
tests/utterances.json
FLOWRA_PLAN.md     feature inventory, condition matrix, workflows, plans, revenue, roadmap, regulatory notes
```

## Demo script (3 minutes)

1. **Landing page** (20 s): "Flowra: your cycle, understood." Scroll features. Click **Try the demo**.
2. **Today** (30 s): cycle ring with estimate range; tap flow and symptoms; open the pattern card.
3. **Health pattern** (40 s): "Pain pattern sometimes linked with endometriosis": show *why* (exact logs), overlapping conditions, no percentages. Tap **Consult a doctor**.
4. **Doctors** (30 s): filter Kochi + online; book a slot; tick "share my report"; show the private link.
5. **Report** (20 s): one page with cycles, pad-chart score, her Malayalam words, questions to ask.
6. **Voice** (20 s): Today → mic or Malayalam sample → confirm card.
7. **Shop** (20 s): "Suggested for you" with reasons; Sponsored labels; never based on conditions.
8. **Close** (10 s): "AI listens, clear rules decide, a doctor confirms. Data never sold."
