import { handle, json, readJson } from "@/lib/api";
import { clearSessionCookie, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toMeDTO } from "@/lib/dto";
import { SettingsSchema } from "@/lib/types";
import { mergeSettings, parseSettings, SettingsPatchSchema } from "@/lib/settings";
import { z } from "zod";

const PatchSchema = SettingsSchema.extend({ settings: SettingsPatchSchema.optional(), plan: z.enum(["free", "plus"]).optional() });

/** Update settings: name, language, personalizeShop, avgCycleLength, consent. */
export const PATCH = handle(async (req) => {
  const user = await requireUser();
  const body = PatchSchema.parse(await readJson(req));
  let settings: string | undefined;
  if (body.settings) {
    settings = JSON.stringify(mergeSettings(parseSettings(user.settings), body.settings));
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name,
      language: body.language,
      personalizeShop: body.personalizeShop,
      avgCycleLength: body.avgCycleLength,
      consentAt: body.consent ? user.consentAt ?? new Date() : undefined,
      goal: body.goal,
      settings,
      // Payments are not live: Plus is free during beta (shown clearly in the UI).
      plan: body.plan,
    },
  });
  return json({ user: toMeDTO(updated) });
});

/** Delete the account and ALL data (cascade: events, periods, snapshots, orders). */
export const DELETE = handle(async () => {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
});
