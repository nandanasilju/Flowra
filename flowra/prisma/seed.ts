/**
 * Seed: products, SAMPLE doctors, and three demo logins (sample data):
 *   demo@flowra.app  / demo1234 → "Anjali": endometriosis-linked pain + heavy bleeding (Orange)
 *   riya@flowra.app  / demo1234 → "Riya": long cycles + skin/hair changes (PCOS-linked pattern)
 *   mild@flowra.app  / demo1234 → "Meera": typical cycles (Green)
 * Optional: ADMIN_EMAIL + ADMIN_PASSWORD env → creates an admin account for /admin.
 * Run: npm run seed
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { userCipher } from "../src/lib/crypto";
import { applyPersona, upsertProducts, upsertSampleDoctors } from "../src/lib/seed/apply";
import type { PersonaId } from "../src/lib/seed/personas";
import { computeScore } from "../src/lib/scoring/engine";
import { toPeriodRange, toScoringEvent } from "../src/lib/dto";

async function upsertUser(email: string, name: string, password: string, extra: { isDemo?: boolean; isAdmin?: boolean } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, language: "en", consentAt: new Date(), ...extra },
    update: { name, passwordHash, consentAt: new Date(), ...extra },
  });
}

async function main() {
  await upsertProducts(prisma);
  console.log("✓ 15 products");
  if (process.env.SHOW_SAMPLE_DOCTORS !== "false") {
    await upsertSampleDoctors(prisma);
    console.log("✓ 11 SAMPLE doctor profiles (fictional; replace with real doctors before launch)");
  }

  const personas: [string, string, PersonaId][] = [
    ["demo@flowra.app", "Anjali (sample)", "anjali"],
    ["riya@flowra.app", "Riya (sample)", "riya"],
    ["mild@flowra.app", "Meera (sample)", "mild"],
  ];
  for (const [email, name, persona] of personas) {
    const u = await upsertUser(email, name, "demo1234", { isDemo: true });
    await applyPersona(prisma, u.id, persona, await userCipher(u));
    const [events, periods] = await Promise.all([prisma.painEvent.findMany({ where: { userId: u.id } }), prisma.periodLog.findMany({ where: { userId: u.id } })]);
    const r = computeScore({ events: events.map(toScoringEvent), periods: periods.map(toPeriodRange) });
    console.log(`✓ ${email} (password demo1234): ${events.length} pain logs → attention level ${r.level}`);
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await upsertUser(process.env.ADMIN_EMAIL.toLowerCase(), "Admin", process.env.ADMIN_PASSWORD, { isAdmin: true });
    console.log(`✓ admin account ${process.env.ADMIN_EMAIL}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
