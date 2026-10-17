/**
 * Every threshold the pattern engine uses, in one place.
 *
 * Sources where they exist:
 *   - cycleMin/cycleMax/variationMax/periodMaxDays: FIGO 2018 normal menstrual limits
 *     (frequency 24–38 days, variation ≤ 7–9 days, duration ≤ 8 days).
 *   - pbacHeavy: Higham et al. 1990, PBAC ≥ 100 per period (>80% sensitivity/specificity).
 *   - amenorrheaDays: absence of periods for 3 months is a common clinical cut-off.
 * Everything else is a PLACEHOLDER: requires clinician review.
 */
export const PROFILE_RULES = {
  windowDays: 180,
  cycleMin: 24,
  cycleMax: 38,
  variationMax: 9,
  periodMaxDays: 8,
  minAbnormalCycles: 2, // PLACEHOLDER
  amenorrheaDays: 90,
  pbacHeavy: 100,
  heavyFlowDays: 3, // PLACEHOLDER: days of "heavy" flow in one period
  minBetweenBleedDays: 2, // PLACEHOLDER
  periodPainMin: 4, // PLACEHOLDER (0–10 scale)
  severePainMin: 7, // PLACEHOLDER
  minPainfulCycles: 2, // PLACEHOLDER
  minAcyclicalDays: 3, // PLACEHOLDER
  worseningDelta: 1.5, // PLACEHOLDER: rise in average peak period pain
  minSymptomDays: 2, // PLACEHOLDER
  lutealDays: 7, // days before the next period checked for premenstrual symptoms
  minPmCycles: 2, // premenstrual symptoms in at least 2 cycles (as in PMS/PMDD criteria)
} as const;
