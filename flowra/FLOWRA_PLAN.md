# Flowra product plan

What is **built** (in this codebase), **planned**, or **needs clinical validation / a partner**. No accuracy figures, partnerships or integrations are claimed that don't exist.

## 1. Feature inventory (from EndoLog AI / PainPal)

| Existing feature | Status in Flowra |
|---|---|
| Voice pain logging (EN/HI/ML), confirm card, follow-up question | Retained; adds a cloud-AI off switch |
| Typed + sample voice notes, offline keyword extractor | Retained |
| Pain attention score, "Why this level?", red-flag urgent screen | Retained unchanged |
| Timeline calendar, period start/end | Improved → Calendar with predictions, fertile window, daily logs |
| Insights (pain chart, usual band) | Extended: cycle-length chart, pain-by-cycle-day heatmap, mood by phase |
| Doctor summary (print/PDF) | Extended: cycles + PBAC, patterns, quotes, questions, share links |
| Shop, cart, Care Kit, demo checkout, orders, period-ready reminder | Retained; adds personalised recommendations, retailer links, labels |
| Consent, export, delete, demo personas | Retained; adds goals, encryption, Riya persona |
| Daily cycle tracking, pad chart, mood/energy/sleep, 38 symptoms | **New** |
| Condition-pattern engine (11 conditions) | **New** |
| Doctor discovery & booking, appointments, .ics | **New** |
| Learn + Conditions libraries, personalised tips | **New** |
| Plans (Free/Plus), settings, accessibility, admin, password reset | **New** |
| Push notifications when closed, payments, real doctor network, wearables | Deferred |

## 2. Symptom-to-condition matrix

| Logged pattern | Possible overlapping conditions | Limits | Next step |
|---|---|---|---|
| Severe period pain + ≥ 2 of: pain outside period, pain with sex, bowel/bladder pain at period, worsening, missed activities | Endometriosis, adenomyosis, secondary dysmenorrhea | Symptoms overlap with IBS, infections; needs imaging/laparoscopy | Consult gynaecologist |
| Period pain 4+/10 in ≥ 2 cycles | Primary or secondary dysmenorrhea | Common; severity is subjective | Track + self-care; consult if severe/impacting |
| PBAC ≥ 100, flooding, large clots, bleeding > 8 days | Heavy menstrual bleeding, fibroids, adenomyosis, polyps, thyroid, bleeding disorders | PBAC depends on product use | Consult |
| Heavy bleeding + fatigue/dizziness/breathlessness | Iron-deficiency anaemia | Fatigue has many causes | Blood test |
| ≥ 2 cycles > 38 days, variation > 9 days, or 90 days without a period (+ acne/hair/weight signs) | PCOS, thyroid problems, pregnancy, stress/weight change | Needs blood tests, sometimes ultrasound | Pregnancy test if relevant; consult |
| Bleeding between periods / after sex / cycles < 24 days | Abnormal uterine bleeding (hormonal, polyps, infection, contraception) | — | Consult (soon if after sex) |
| Mood/physical symptoms in the week before the period, easing after, ≥ 2 cycles | PMS; severe → PMDD | Needs daily logs in both halves of the cycle | Track; consult if severe (+ Tele-MANAS 14416) |
| Fever + pelvic pain + unusual discharge | Pelvic inflammatory disease, other infections | — | See a doctor within 24 h; urgent if severe |
| Fainting, soaking a pad hourly, fever with pain, sudden 9+/10, non-stop vomiting | Emergency | — | Urgent screen, call 112 |

No probabilities are shown. "Some signs / several signs" reflects how many listed signals are present.

## 3. Doctor booking workflow

Pattern card → "Consult a doctor" (specialty pre-filled) → search (city, specialty, mode, fee) → profile (qualifications, experience, languages, fee, verification badge) → pick slot (IST, 14 days) → optional reason (encrypted) → optional consent to share a 90-day report link → fees + policy accepted → confirmation + .ics + private link → reminders on Today → reschedule/cancel until 2 h before (cancel also revokes the link).

**Revenue:** transparent flat booking fee per completed booking (₹29 hypothesis, shown upfront; waived in beta) or clinic subscriptions where commissions aren't appropriate under professional rules. Ranking is commission-blind (enforced in code + tested).

## 4. Self-care and product workflow

Logged symptom (e.g. pad irritation) → tip card on Today → article (what to try, precautions, see-a-doctor signs, references) → related products (fragrance-free, cotton, cup, period underwear) with "why" → retailer link (labelled; affiliate disclosed) → dismiss or adjust preferences. Possible conditions are never used for products, and no products appear on condition or urgent screens.

## 5. Plans

| | Free | Plus (₹99/month, hypothesis) |
|---|---|---|
| Tracking, predictions, reminders, voice logging | ✔ | ✔ |
| Pattern awareness, urgent guidance | ✔ always | ✔ |
| Doctor search & booking | ✔ | ✔ |
| Report | 30 days | 30/60/90 days + longer share links |
| Charts | Standard | + pain-by-cycle-day heatmap |
| Calendar export (.ics) | – | ✔ |
| Learn, tips, export/delete | ✔ | ✔ |

Two tiers are simpler than three: "Care" benefits (consultation prep, partner-clinic perks) fit better as booking features than as a separate subscription.

## 6. Revenue streams (assumptions, not projections)

| Stream | User gets | Complexity | Considerations | Phase |
|---|---|---|---|---|
| Plus subscription | Depth + convenience | Low (needs Razorpay) | Never gate safety | MVP+ |
| Booking fee / clinic subscription | Easy booking, prepared visit | Medium | Medical-ethics rules on fee-splitting; clear pricing | Phase 3 |
| Affiliate product links | Relevant products | Low | Disclosure; no health-condition targeting | Phase 3 |
| Clinic partnerships (Flowra report intake) | Faster, better consultations | Medium | Consent; data minimisation | Phase 4 |
| Sponsored education | Free content | Medium | Clear labels; clinician review; no product claims | Later |
| Institutional plans (colleges, employers) | Access + awareness sessions | Medium | Aggregate, opt-in reporting only | Later |

Never: selling identifiable health data, or ads targeted by health information.

## 7. MVP vs future

| MVP (built) | Next | Later |
|---|---|---|
| Tracker, logging, voice, patterns, attention level, insights, reports + share links, learn, conditions, doctor booking (sample doctors), shop + recommendations, settings, plans (beta), encryption, admin | Real doctors + clinic agreements, Razorpay payments, verified affiliate links, push notifications, clinician review of thresholds | On-device storage mode, wearables (Health Connect / HealthKit), WhatsApp logging, more languages, validated ML models, teen mode with guardian consent |

## 8. Clinical, privacy and regulatory notes

- Positioned as tracking + health awareness, not diagnosis. Making diagnostic claims could bring the product under medical-device regulation (CDSCO).
- Clinician review of all thresholds, wording and articles before public launch; then a usability study and a clinician-readability study.
- DPDP Act 2023: explicit consent, purpose limitation, export and deletion (built), breach process, grievance contact (to add).
- Doctor verification against medical council registers before the "verified" badge.
- Tele-medicine practice guidelines apply to online consultations run by partner doctors.

## 9. User journey

Sign up → goal + consent → Today (cycle ring, quick log, mic) → logs over weeks → pattern card appears with "why" → tips meanwhile → Consult a doctor → book + share report → visit with a one-page report → after the visit keep tracking; shop suggestions match her preferences and period timing.
