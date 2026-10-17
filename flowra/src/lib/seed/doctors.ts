/**
 * SAMPLE doctor profiles for demos (isSample = true, verified = false).
 * They are fictional and clearly labelled "Sample profile" in the UI. Before launch, remove them
 * (set SHOW_SAMPLE_DOCTORS=false) and add real, registration-checked doctors in /admin.
 */
export interface SeedDoctor {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  city: string;
  clinic: string;
  languages: string[];
  modes: string[];
  feeInr: number;
  bio: string;
  schedule: { days: number[]; start: string; end: string; slotMinutes: number };
}

const weekdays = [1, 2, 3, 4, 5];
const sixDays = [1, 2, 3, 4, 5, 6];

export const SEED_DOCTORS: SeedDoctor[] = [
  { id: "d01", name: "Dr. Lakshmi Nair (sample)", specialty: "gynaecologist", qualifications: "MBBS, MS (Obstetrics & Gynaecology)", experienceYears: 14, city: "Kochi", clinic: "Sample Women's Clinic, Kadavanthra", languages: ["English", "Malayalam", "Hindi"], modes: ["in_person", "online"], feeInr: 700, bio: "Special interest in painful periods and endometriosis care.", schedule: { days: sixDays, start: "10:00", end: "13:00", slotMinutes: 20 } },
  { id: "d02", name: "Dr. Anita Menon (sample)", specialty: "gynaecologist", qualifications: "MBBS, DNB (OBG)", experienceYears: 9, city: "Thiruvananthapuram", clinic: "Sample Care Clinic, Pattom", languages: ["English", "Malayalam"], modes: ["in_person"], feeInr: 500, bio: "Adolescent and young-adult gynaecology, PCOS.", schedule: { days: weekdays, start: "16:00", end: "19:00", slotMinutes: 20 } },
  { id: "d03", name: "Dr. Priya Sharma (sample)", specialty: "gynaecologist", qualifications: "MBBS, MD (OBG)", experienceYears: 18, city: "Bengaluru", clinic: "Sample Health Centre, Indiranagar", languages: ["English", "Hindi", "Kannada"], modes: ["in_person", "online"], feeInr: 900, bio: "Heavy menstrual bleeding, fibroids and adenomyosis.", schedule: { days: sixDays, start: "09:30", end: "12:30", slotMinutes: 30 } },
  { id: "d04", name: "Dr. Kavya Reddy (sample)", specialty: "gynaecologist", qualifications: "MBBS, MS (OBG)", experienceYears: 6, city: "Online", clinic: "Teleconsultation", languages: ["English", "Hindi", "Telugu"], modes: ["online"], feeInr: 400, bio: "Online consultations for period problems and PCOS.", schedule: { days: [1, 2, 3, 4, 5, 6, 0], start: "18:00", end: "21:00", slotMinutes: 15 } },
  { id: "d05", name: "Dr. Neha Gupta (sample)", specialty: "gynaecologist", qualifications: "MBBS, DGO", experienceYears: 11, city: "Delhi", clinic: "Sample Clinic, Saket", languages: ["English", "Hindi"], modes: ["in_person", "online"], feeInr: 800, bio: "Menstrual disorders and pelvic pain.", schedule: { days: weekdays, start: "11:00", end: "14:00", slotMinutes: 20 } },
  { id: "d06", name: "Dr. Farah Khan (sample)", specialty: "gynaecologist", qualifications: "MBBS, MS (OBG)", experienceYears: 15, city: "Mumbai", clinic: "Sample Women's Health, Bandra", languages: ["English", "Hindi", "Urdu"], modes: ["in_person"], feeInr: 1000, bio: "Endometriosis and minimally invasive gynaecology.", schedule: { days: sixDays, start: "10:00", end: "13:00", slotMinutes: 30 } },
  { id: "d07", name: "Dr. Meenakshi Iyer (sample)", specialty: "gynaecologist", qualifications: "MBBS, MD (OBG)", experienceYears: 20, city: "Chennai", clinic: "Sample Clinic, Adyar", languages: ["English", "Tamil"], modes: ["in_person", "online"], feeInr: 750, bio: "Abnormal uterine bleeding and menopause transition.", schedule: { days: weekdays, start: "17:00", end: "20:00", slotMinutes: 20 } },
  { id: "d08", name: "Dr. Rahul Varma (sample)", specialty: "endocrinologist", qualifications: "MBBS, MD, DM (Endocrinology)", experienceYears: 12, city: "Kochi", clinic: "Sample Endocrine Centre, Edappally", languages: ["English", "Malayalam"], modes: ["in_person", "online"], feeInr: 900, bio: "PCOS, thyroid and hormonal conditions.", schedule: { days: weekdays, start: "09:00", end: "12:00", slotMinutes: 20 } },
  { id: "d09", name: "Dr. Sana Thomas (sample)", specialty: "psychiatrist", qualifications: "MBBS, MD (Psychiatry)", experienceYears: 8, city: "Online", clinic: "Teleconsultation", languages: ["English", "Malayalam", "Hindi"], modes: ["online"], feeInr: 800, bio: "Women's mental health, including PMDD.", schedule: { days: [1, 3, 5], start: "17:00", end: "20:00", slotMinutes: 30 } },
  { id: "d10", name: "Dr. Arjun Pillai (sample)", specialty: "general_physician", qualifications: "MBBS, MD (General Medicine)", experienceYears: 10, city: "Kochi", clinic: "Sample Family Clinic, Vyttila", languages: ["English", "Malayalam", "Tamil"], modes: ["in_person", "online"], feeInr: 400, bio: "Anaemia, fatigue and general health checks.", schedule: { days: sixDays, start: "08:30", end: "12:00", slotMinutes: 15 } },
  { id: "d11", name: "Dr. Divya Rao (sample)", specialty: "dermatologist", qualifications: "MBBS, MD (Dermatology)", experienceYears: 7, city: "Bengaluru", clinic: "Sample Skin Clinic, Jayanagar", languages: ["English", "Kannada", "Hindi"], modes: ["in_person", "online"], feeInr: 600, bio: "Hormonal acne and hair concerns.", schedule: { days: weekdays, start: "15:00", end: "18:00", slotMinutes: 20 } },
];
