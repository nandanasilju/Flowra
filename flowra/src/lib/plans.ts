/**
 * Plans. Safety alerts, condition-pattern cards, urgent guidance, basic reports, doctor
 * search and data export are ALWAYS free. Plus adds convenience and depth only.
 * Payments are not live: Plus can be activated free during beta (clearly labelled).
 */
export const PLANS = {
  free: {
    name: "Flowra Free",
    priceInr: 0,
    features: [
      "Period calendar, predictions and reminders",
      "Voice and manual symptom logging",
      "Condition-pattern awareness and urgent-care alerts",
      "30-day doctor report (PDF)",
      "Doctor search and booking",
      "Learn library and personalised tips",
      "Export and delete your data",
    ],
  },
  plus: {
    name: "Flowra Plus",
    priceInr: 99,
    features: [
      "Everything in Free",
      "6-cycle comparison charts and pain-by-cycle-day heatmap",
      "60 and 90-day reports and shareable doctor links",
      "Calendar export of predicted periods (.ics)",
      "Custom symptoms and logging shortcuts",
      "Priority support",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function isPlus(plan: string | null | undefined): boolean {
  return plan === "plus";
}
