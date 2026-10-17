import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { WelcomeClient } from "./welcome-client";

export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: { searchParams: { mode?: string; demo?: string } }) {
  const user = await getSessionUser();
  if (user) redirect(user.consentAt ? "/home" : "/consent");
  return <WelcomeClient initialMode={searchParams.mode === "login" ? "login" : "register"} autoDemo={searchParams.demo === "1"} />;
}
