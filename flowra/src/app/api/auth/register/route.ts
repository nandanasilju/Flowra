import { handle, HttpError, json, readJson } from "@/lib/api";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toMeDTO } from "@/lib/dto";
import { RegisterSchema } from "@/lib/types";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const POST = handle(async (req) => {
  rateLimit(`register:${clientIp(req.headers)}`, 5, 60_000);
  const body = RegisterSchema.parse(await readJson(req));
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new HttpError(409, "An account with this email already exists. Try signing in.");
  const user = await prisma.user.create({
    data: { email: body.email, name: body.name, passwordHash: await hashPassword(body.password) },
  });
  const res = json({ user: toMeDTO(user) }, 201);
  setSessionCookie(res, user.id);
  return res;
});
