/** Write demo data into the database. */
import type { PrismaClient } from "@prisma/client";
import type { FieldCipher } from "../crypto";
import { SEED_DOCTORS } from "./doctors";
import { generatePersona, type PersonaId } from "./personas";
import { SEED_PRODUCTS } from "./products";

/** Replace one user's health data with a sample persona. Free-text fields are encrypted. */
export async function applyPersona(db: PrismaClient, userId: string, persona: PersonaId, cipher: FieldCipher, now: Date = new Date()): Promise<void> {
  const data = generatePersona(persona, now);
  await db.$transaction([
    db.painEvent.deleteMany({ where: { userId } }),
    db.dailyLog.deleteMany({ where: { userId } }),
    db.periodLog.deleteMany({ where: { userId } }),
    db.scoreSnapshot.deleteMany({ where: { userId } }),
    db.painEvent.createMany({
      data: data.events.map((e) => ({
        userId,
        occurredAt: e.occurredAt,
        painScore: e.painScore,
        descriptors: JSON.stringify(e.descriptors),
        locations: JSON.stringify(e.locations),
        onsetNote: cipher.encN(e.onsetNote),
        durationMinutes: e.durationMinutes,
        isPeriodDay: e.isPeriodDay,
        bleeding: e.bleeding,
        functionalImpact: e.functionalImpact,
        missedActivity: e.missedActivity,
        bedBound: e.bedBound,
        associated: JSON.stringify(e.associated),
        medications: JSON.stringify(e.medications),
        redFlags: JSON.stringify(e.redFlags),
        transcript: cipher.enc(e.transcript),
        transcriptEn: cipher.enc(e.transcriptEn),
        languageDetected: e.languageDetected,
        source: e.source,
        confidence: e.confidence,
      })),
    }),
    db.dailyLog.createMany({
      data: data.dailyLogs.map((l) => ({
        userId,
        date: l.date,
        flow: l.flow,
        pbac: JSON.stringify(l.pbac),
        mood: l.mood,
        energy: l.energy,
        sleepHours: l.sleepHours,
        symptoms: JSON.stringify(l.symptoms),
      })),
    }),
    db.periodLog.createMany({ data: data.periods.map((p) => ({ userId, startDate: p.startDate, endDate: p.endDate })) }),
    db.user.update({ where: { id: userId }, data: { avgCycleLength: data.avgCycleLength } }),
  ]);
}

/** Insert or refresh the catalogue (keeps admin-edited links if already verified). */
export async function upsertProducts(db: PrismaClient): Promise<void> {
  for (const p of SEED_PRODUCTS) {
    const data = {
      name: p.name,
      category: p.category,
      description: p.description,
      priceInr: p.priceInr,
      emoji: p.emoji,
      tags: JSON.stringify(p.tags),
      sponsored: p.sponsored,
      affiliate: p.affiliate,
      stock: p.stock,
    };
    const existing = await db.product.findUnique({ where: { id: p.id } });
    if (existing) {
      await db.product.update({ where: { id: p.id }, data: existing.linkVerified ? data : { ...data, url: p.url, retailer: p.retailer, linkVerified: false } });
    } else {
      await db.product.create({ data: { id: p.id, ...data, url: p.url, retailer: p.retailer, linkVerified: p.linkVerified } });
    }
  }
}

/** Insert or refresh SAMPLE doctors (fictional, labelled). */
export async function upsertSampleDoctors(db: PrismaClient): Promise<void> {
  for (const d of SEED_DOCTORS) {
    const data = {
      name: d.name,
      specialty: d.specialty,
      qualifications: d.qualifications,
      experienceYears: d.experienceYears,
      city: d.city,
      clinic: d.clinic,
      languages: JSON.stringify(d.languages),
      modes: JSON.stringify(d.modes),
      feeInr: d.feeInr,
      bio: d.bio,
      schedule: JSON.stringify(d.schedule),
      verified: false,
      isSample: true,
      active: true,
    };
    await db.doctor.upsert({ where: { id: d.id }, create: { id: d.id, ...data }, update: data });
  }
}
