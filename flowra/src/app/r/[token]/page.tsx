import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { ReportView } from "@/components/report-view";
import { PrintButton } from "./print-button";
import { prisma } from "@/lib/db";
import { buildReport } from "@/lib/report-service";
import { hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Shared health report · Flowra" };

/** Read-only report shared by the patient with explicit consent. Expiring and revocable. */
export default async function SharedReportPage({ params }: { params: { token: string } }) {
  const link = await prisma.shareLink.findUnique({ where: { tokenHash: hashToken(params.token) }, include: { user: true } });
  const valid = link && !link.revokedAt && link.expiresAt > new Date();
  if (!link || !valid) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
        <Logo />
        <h1 className="text-xl font-bold">This link has expired or was revoked</h1>
        <p className="text-sand-600">Please ask the patient to share a new link.</p>
      </main>
    );
  }
  await prisma.shareLink.update({ where: { id: link.id }, data: { views: { increment: 1 } } });
  const report = await buildReport(link.user, link.days);
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <Logo />
        <PrintButton />
      </div>
      <p className="no-print mb-4 rounded-md bg-teal-50 p-3 text-sm text-teal-700">Shared by the patient with consent · read-only · expires {link.expiresAt.toLocaleDateString("en-IN")}.</p>
      <ReportView report={report} />
    </main>
  );
}
