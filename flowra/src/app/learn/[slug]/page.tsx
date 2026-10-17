import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";
import { getArticle } from "@/lib/content/learn";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/learn" className="text-sm font-semibold text-plum-600">← Learn</Link>
        <p className="mt-4 text-sm font-semibold text-teal-700">{a.category}</p>
        <h1 className="text-3xl font-bold">{a.title}</h1>
        <p className="mt-3 text-sand-800">{a.explanation}</p>

        {a.tryThis.length > 0 && (
          <section className="mt-6 rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-teal-600" aria-hidden /> Things you can try</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{a.tryThis.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
        )}
        {a.precautions.length > 0 && (
          <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-amber-900"><ShieldAlert className="h-5 w-5" aria-hidden /> Precautions</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">{a.precautions.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
        )}
        {a.seeDoctor.length > 0 && (
          <section className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-red-900"><AlertTriangle className="h-5 w-5" aria-hidden /> See a doctor if</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">{a.seeDoctor.map((t) => <li key={t}>{t}</li>)}</ul>
            <Link href={user ? "/doctors" : "/welcome"} className="mt-3 inline-flex h-10 items-center rounded-md bg-plum-600 px-4 text-sm font-semibold text-white">Find a doctor</Link>
          </section>
        )}
        {a.productTags.length > 0 && (
          <p className="mt-4 text-sm text-sand-600">
            Related products: <Link href={user ? `/shop?tag=${a.productTags[0]}` : "/welcome"} className="font-semibold text-plum-600 underline">browse options</Link> (products don&apos;t treat medical problems; everyone responds differently).
          </p>
        )}
        {a.references.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="font-semibold">Trusted references</h2>
            <ul className="mt-1 space-y-1">
              {a.references.map((r) => (
                <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-plum-600 underline">{r.label}</a></li>
              ))}
            </ul>
          </section>
        )}
        <p className="mt-8 text-xs text-sand-600">General education, not personal medical advice. Content awaiting clinician review.</p>
      </article>
    </PublicShell>
  );
}
