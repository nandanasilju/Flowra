import { handle, HttpError, json, readJson } from "@/lib/api";
import { checkPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toMeDTO } from "@/lib/dto";
import { LoginSchema } from "@/lib/types";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const POST = handle(async (req) => {
  rateLimit(`login:${clientIp(req.headers)}`, 10, 60_000);
  const body = LoginSchema.parse(await readJson(req));
  rateLimit(`login:${body.email}`, 10, 15 * 60_000);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  // Same message for unknown email and wrong password.
  if (!user || !(await checkPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  const res = json({ user: toMeDTO(user) });
  setSessionCookie(res, user.id);
  return res;
});
