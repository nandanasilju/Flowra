import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ConsentClient } from "./consent-client";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/welcome");
  if (user.consentAt) redirect("/home");
  const language = user.language === "hi" || user.language === "ml" ? user.language : "en";
  return <ConsentClient name={user.name} initialLanguage={language} />;
}
