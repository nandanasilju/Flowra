/**
 * Condition library (educational). Written in plain language; reviewed sources linked.
 * Flowra never diagnoses: these pages explain conditions and when to see a doctor.
 * Content requires clinician review before production use.
 */
export interface Reference {
  label: string;
  url: string;
}

export interface ConditionInfo {
  slug: string;
  name: string;
  short: string;
  about: string;
  commonSigns: string[];
  overlapsWith: string[];
  howFlowraLooks: string;
  doctorMayDo: string[];
  urgent: string[];
  references: Reference[];
}

const NHS = (path: string, label: string): Reference => ({ label: `NHS: ${label}`, url: `https://www.nhs.uk/${path}` });

export const CONDITIONS: ConditionInfo[] = [
  {
    slug: "endometriosis",
    name: "Endometriosis",
    short: "Tissue similar to the womb lining grows outside the womb, often causing severe pain.",
    about:
      "Endometriosis is a long-term condition where tissue similar to the lining of the womb grows in other places, such as the ovaries and the lining of the pelvis. The WHO estimates it affects about 10% of women and girls of reproductive age. It often takes years to diagnose because pain is dismissed as 'normal'.",
    commonSigns: [
      "Period pain severe enough to stop daily activities",
      "Pelvic pain outside your period",
      "Pain during or after sex",
      "Pain with bowel movements or when peeing, especially around your period",
      "Pain that gets worse over time",
      "Difficulty getting pregnant",
    ],
    overlapsWith: ["Adenomyosis", "Fibroids", "Irritable bowel syndrome", "Pelvic infections"],
    howFlowraLooks: "Severe period pain plus at least two of: pain outside your period, pain with sex, bowel or bladder pain around your period, pain that is getting worse, or missed activities.",
    doctorMayDo: ["Ask about your symptom history (your Flowra report helps)", "Pelvic examination", "Ultrasound or MRI", "Laparoscopy (keyhole surgery) to confirm", "Discuss pain relief and hormone treatments"],
    urgent: ["Sudden, very severe pelvic pain", "Fainting", "Fever with pelvic pain"],
    references: [
      { label: "WHO: Endometriosis fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/endometriosis" },
      NHS("conditions/endometriosis/", "Endometriosis"),
    ],
  },
  {
    slug: "pcos",
    name: "PCOS (polycystic ovary syndrome)",
    short: "A common hormonal condition linked with irregular periods, acne and extra hair growth.",
    about:
      "PCOS is a common hormonal condition that affects how the ovaries work. It is often linked with irregular or infrequent periods, higher levels of androgens (causing acne or extra hair), and sometimes weight gain. The NHS now also uses the newer name polyendocrine metabolic ovarian syndrome (PMOS).",
    commonSigns: ["Irregular, infrequent or no periods", "Acne", "Extra hair on the face or body", "Thinning scalp hair", "Weight gain", "Dark skin patches on the neck or armpits"],
    overlapsWith: ["Thyroid problems", "High prolactin", "Stress or weight-related cycle changes"],
    howFlowraLooks: "Cycles longer than 38 days (or very irregular, or missed) plus logged acne, extra hair growth, scalp hair thinning or weight gain.",
    doctorMayDo: ["Blood tests for hormones and blood sugar", "Pelvic ultrasound", "Lifestyle advice and treatments for symptoms"],
    urgent: [],
    references: [NHS("conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/", "PMOS (formerly PCOS)")],
  },
  {
    slug: "pms",
    name: "PMS (premenstrual syndrome)",
    short: "Physical and emotional symptoms in the days before a period that ease once it starts.",
    about: "Many women have symptoms such as bloating, breast tenderness, irritability or low mood in the week or two before their period. The key feature is timing: symptoms ease once the period starts.",
    commonSigns: ["Mood swings, irritability, feeling low", "Bloating", "Breast tenderness", "Headaches", "Tiredness", "Food cravings"],
    overlapsWith: ["PMDD", "Depression or anxiety", "Thyroid problems"],
    howFlowraLooks: "Mood or physical symptoms on at least 2 of the 7 days before your period, easing after it starts, in at least 2 cycles.",
    doctorMayDo: ["Ask you to keep a symptom diary for 2 cycles (Flowra does this)", "Discuss lifestyle changes, talking therapies or medicines"],
    urgent: [],
    references: [NHS("conditions/pre-menstrual-syndrome/", "PMS (premenstrual syndrome)")],
  },
  {
    slug: "pmdd",
    name: "PMDD (premenstrual dysphoric disorder)",
    short: "A severe form of PMS with strong mood symptoms before periods.",
    about: "PMDD is a more severe form of PMS. Mood symptoms such as depression, hopelessness, anxiety or anger can be intense enough to affect work, study and relationships, and ease after the period starts. It is treatable.",
    commonSigns: ["Feeling hopeless or very low before your period", "Severe anxiety or tension", "Anger or conflict with others", "Trouble concentrating", "Symptoms easing after your period starts"],
    overlapsWith: ["PMS", "Depression", "Anxiety disorders"],
    howFlowraLooks: "Severe premenstrual mood symptoms (very low mood or hopelessness) in at least 2 cycles, easing after the period starts.",
    doctorMayDo: ["Review 2 cycles of daily mood logs", "Discuss therapy, medicines or hormonal treatment"],
    urgent: ["Thoughts of harming yourself: call Tele-MANAS 14416 (free, 24×7) or 112"],
    references: [NHS("conditions/pre-menstrual-syndrome/", "PMS, including PMDD")],
  },
  {
    slug: "adenomyosis",
    name: "Adenomyosis",
    short: "Womb-lining tissue grows into the muscle wall of the womb.",
    about: "In adenomyosis, tissue like the womb lining grows into the muscular wall of the womb. It can cause heavy, painful periods and pelvic pressure. It can occur alongside endometriosis or fibroids.",
    commonSigns: ["Heavy periods", "Severe period cramps", "Pelvic pressure or bloating", "Pain during sex"],
    overlapsWith: ["Endometriosis", "Fibroids", "Heavy menstrual bleeding"],
    howFlowraLooks: "Heavy bleeding together with severe period pain or pelvic pressure. Flowra shows this together with fibroids and heavy bleeding, because the signs overlap.",
    doctorMayDo: ["Pelvic examination", "Ultrasound or MRI", "Discuss pain and bleeding treatments"],
    urgent: ["Soaking a pad every hour for 2+ hours", "Fainting"],
    references: [NHS("conditions/adenomyosis/", "Adenomyosis")],
  },
  {
    slug: "fibroids",
    name: "Uterine fibroids",
    short: "Non-cancerous growths in or around the womb.",
    about: "Fibroids are non-cancerous growths in or around the womb. Many cause no symptoms, but some cause heavy or long periods, pelvic pressure, frequent urination or pain.",
    commonSigns: ["Heavy or long periods", "Pelvic pressure or a swollen tummy", "Peeing more often", "Constipation", "Pain during sex"],
    overlapsWith: ["Adenomyosis", "Heavy menstrual bleeding", "Endometriosis"],
    howFlowraLooks: "Heavy bleeding (pad-chart score of 100+ or flooding) or periods longer than 8 days, especially with pelvic pressure.",
    doctorMayDo: ["Pelvic examination", "Ultrasound", "Blood test for anaemia", "Discuss treatments if symptoms are bothersome"],
    urgent: ["Very heavy bleeding with dizziness or fainting"],
    references: [NHS("conditions/fibroids/", "Fibroids")],
  },
  {
    slug: "dysmenorrhea",
    name: "Dysmenorrhea (painful periods)",
    short: "Primary: common period cramps. Secondary: period pain caused by another condition.",
    about: "Primary dysmenorrhea is common period pain without another cause, usually starting with the period and lasting 1–3 days. Secondary dysmenorrhea is caused by another condition, such as endometriosis, adenomyosis or fibroids, and often starts later in life or gets worse over time.",
    commonSigns: ["Cramping in the lower tummy, back or thighs", "Pain starting just before or with the period", "Nausea or loose motions with pain"],
    overlapsWith: ["Endometriosis", "Adenomyosis", "Fibroids", "Pelvic infections"],
    howFlowraLooks: "Period pain of 4+/10 in at least 2 cycles; more urgent when 7+/10 or when it stops your usual activities.",
    doctorMayDo: ["Check for an underlying cause", "Discuss pain relief options and hormonal treatments"],
    urgent: ["Sudden severe pain", "Fever with pelvic pain"],
    references: [NHS("conditions/period-pain/", "Period pain")],
  },
  {
    slug: "heavy-bleeding",
    name: "Heavy or abnormal uterine bleeding",
    short: "Bleeding that is heavier, longer or at different times than usual.",
    about: "Heavy menstrual bleeding is bleeding that affects your daily life, such as needing to change products every 1–2 hours, passing large clots, or flooding. Abnormal uterine bleeding also includes bleeding between periods, after sex, or cycles outside 24–38 days.",
    commonSigns: ["Changing pads or tampons every 1–2 hours", "Large clots", "Flooding through clothes", "Periods lasting more than 8 days", "Bleeding between periods or after sex"],
    overlapsWith: ["Fibroids", "Adenomyosis", "Polyps", "Thyroid problems", "Bleeding disorders", "Iron-deficiency anaemia"],
    howFlowraLooks: "Pad chart (PBAC) score of 100 or more in a period, flooding, large clots, periods over 8 days, or bleeding between periods or after sex.",
    doctorMayDo: ["Blood tests (including for anaemia)", "Ultrasound", "Discuss treatments"],
    urgent: ["Soaking a pad or tampon every hour for 2+ hours", "Dizziness or fainting"],
    references: [NHS("conditions/heavy-periods/", "Heavy periods")],
  },
  {
    slug: "anaemia",
    name: "Iron-deficiency anaemia",
    short: "Low iron, often caused by heavy periods.",
    about: "Heavy periods are one of the most common causes of iron-deficiency anaemia. It can cause tiredness, shortness of breath and dizziness. A simple blood test can check your levels.",
    commonSigns: ["Tiredness and lack of energy", "Shortness of breath", "Dizziness", "Pale skin", "Heart palpitations"],
    overlapsWith: ["Thyroid problems", "Other causes of fatigue"],
    howFlowraLooks: "Heavy bleeding signals together with tiredness, dizziness or breathlessness on several days.",
    doctorMayDo: ["Blood test (haemoglobin, ferritin)", "Treat the cause of heavy bleeding", "Advise on iron supplements if needed"],
    urgent: ["Chest pain, fainting or severe breathlessness"],
    references: [NHS("conditions/iron-deficiency-anaemia/", "Iron deficiency anaemia")],
  },
  {
    slug: "irregular-periods",
    name: "Irregular or missed periods",
    short: "Cycles outside 24–38 days, varying a lot, or stopping.",
    about: "Cycle length can vary, but cycles regularly outside 24–38 days, varying by more than 7–9 days, or stopping for 3 months may have a cause worth checking, such as pregnancy, stress, weight change, PCOS or thyroid problems.",
    commonSigns: ["Cycles longer than 38 days or shorter than 24 days", "Large differences between cycles", "No period for 3 months"],
    overlapsWith: ["PCOS", "Thyroid problems", "Pregnancy", "Stress, weight change or intense exercise"],
    howFlowraLooks: "At least 2 cycles outside 24–38 days, a variation of more than 9 days across 3+ cycles, or 90 days without a period.",
    doctorMayDo: ["Pregnancy test", "Blood tests for hormones and thyroid", "Ultrasound"],
    urgent: ["Missed period with sudden one-sided pain, bleeding or fainting (possible ectopic pregnancy): call 112"],
    references: [NHS("symptoms/irregular-periods/", "Irregular periods")],
  },
  {
    slug: "pid",
    name: "Pelvic inflammatory disease (PID)",
    short: "An infection of the reproductive organs that needs prompt treatment.",
    about: "PID is an infection of the womb, fallopian tubes or ovaries, often caused by a sexually transmitted infection. It needs prompt antibiotic treatment to prevent complications.",
    commonSigns: ["Pelvic or lower tummy pain", "Fever", "Unusual vaginal discharge", "Pain during sex or when peeing", "Bleeding between periods or after sex"],
    overlapsWith: ["Other infections", "Endometriosis", "Appendicitis"],
    howFlowraLooks: "Fever together with pelvic pain and unusual discharge.",
    doctorMayDo: ["Examination and swabs", "Antibiotics"],
    urgent: ["Severe pain, high fever, vomiting or feeling very unwell: seek urgent care"],
    references: [NHS("conditions/pelvic-inflammatory-disease-pid/", "Pelvic inflammatory disease")],
  },
];

export function getCondition(slug: string): ConditionInfo | undefined {
  return CONDITIONS.find((c) => c.slug === slug);
}
