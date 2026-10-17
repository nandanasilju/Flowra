import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";
import { ARTICLES } from "@/lib/content/learn";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await getSessionUser();
  const cats = [...new Set(ARTICLES.map((a) => a.category))];
  return (
    <PublicShell signedIn={Boolean(user)}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold">Learn: period comfort & self-care</h1>
        <p className="mt-2 text-sand-600">Practical, safe guidance. Each topic says what to try, precautions, and when to see a doctor.</p>
        {cats.map((c) => (
          <section key={c} className="mt-8">
            <h2 className="text-lg font-semibold text-plum-700">{c}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ARTICLES.filter((a) => a.category === c).map((a) => (
                <Link key={a.slug} href={`/learn/${a.slug}`} className="rounded-lg border border-sand-200 bg-white p-4 shadow-sm hover:border-plum-300">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-sand-600">{a.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <p className="mt-10 text-sm text-sand-600">
          Looking for information on conditions? See the <Link href="/conditions" className="font-semibold text-plum-600 underline">conditions library</Link>.
        </p>
      </div>
    </PublicShell>
  );
}
