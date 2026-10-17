import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl" aria-hidden>🌸</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <Link href="/" className="font-semibold text-plum-600 underline">
        Go to Flowra
      </Link>
    </main>
  );
}
