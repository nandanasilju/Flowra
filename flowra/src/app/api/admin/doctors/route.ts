import { z } from "zod";
import { handle, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDoctorDTO } from "@/lib/dto";
import { MODES, ScheduleSchema, SPECIALTIES } from "@/lib/doctors";

export const dynamic = "force-dynamic";

const DoctorInput = z.object({
  name: z.string().trim().min(3).max(80),
  specialty: z.enum(SPECIALTIES),
  qualifications: z.string().trim().min(2).max(120),
  experienceYears: z.number().int().min(0).max(60),
  city: z.string().trim().min(2).max(40),
  clinic: z.string().trim().min(2).max(120),
  languages: z.array(z.string().trim().min(2).max(20)).min(1).max(8),
  modes: z.array(z.enum(MODES)).min(1),
  feeInr: z.number().int().min(0).max(100000),
  bio: z.string().max(400).default(""),
  schedule: ScheduleSchema,
  verified: z.boolean().default(false),
});

export const GET = handle(async () => {
  await requireAdmin();
  const list = await prisma.doctor.findMany({ orderBy: { createdAt: "desc" } });
  return json({ doctors: list.map((d) => ({ ...toDoctorDTO(d, null), active: d.active, schedule: JSON.parse(d.schedule || "{}") as unknown })) });
});

/** Add a real doctor (isSample=false). Mark verified only after checking their medical registration. */
export const POST = handle(async (req) => {
  await requireAdmin();
  const b = DoctorInput.parse(await readJson(req));
  const d = await prisma.doctor.create({
    data: { ...b, languages: JSON.stringify(b.languages), modes: JSON.stringify(b.modes), schedule: JSON.stringify(b.schedule), isSample: false },
  });
  return json({ doctor: toDoctorDTO(d, null) }, 201);
});

const Patch = z.object({ id: z.string().min(1), verified: z.boolean().optional(), active: z.boolean().optional(), feeInr: z.number().int().min(0).max(100000).optional() });

export const PATCH = handle(async (req) => {
  await requireAdmin();
  const { id, ...data } = Patch.parse(await readJson(req));
  const d = await prisma.doctor.update({ where: { id }, data });
  return json({ doctor: toDoctorDTO(d, null) });
});
