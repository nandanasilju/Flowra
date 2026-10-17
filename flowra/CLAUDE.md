# Flowra – rules for anyone (human or AI) changing this code

1. The LLM (Gemini) is used ONLY to transcribe and extract structured fields. Scores, levels, pattern cards and red flags are deterministic, tested TypeScript (src/lib/scoring, src/lib/patterns, src/lib/cycles).
2. Never diagnose. Pattern cards list overlapping conditions, explain the exact triggering logs, and NEVER show probabilities or percentages.
3. Danger signs → URGENT screen (112) regardless of score. No shop or promotions on urgent/condition screens.
4. Audio is never stored. Nothing is saved before the user confirms. Free-text health fields are AES-256-GCM encrypted (src/lib/crypto.ts).
5. Commerce never uses pattern cards/conditions. Recommendations use only stated preferences, comfort symptoms and cycle timing; sponsored/affiliate status never affects ranking; labels are shown.
6. Doctor ranking never uses fees or commission.
7. Safety features, pattern awareness, basic reports and data export/delete are always free.
8. Don't claim encryption, validation or accuracy that isn't implemented. Thresholds without a published source are marked "PLACEHOLDER: requires clinician review".
9. Run `npm test` and `npm run typecheck` before committing.
