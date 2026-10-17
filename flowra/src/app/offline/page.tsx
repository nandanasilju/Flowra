export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl" aria-hidden>📴</p>
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="text-sand-600">Flowra needs a connection to save logs. Please reconnect and try again.</p>
      <p className="text-sm text-sand-600">In an emergency call <a className="font-bold text-level-urgent underline" href="tel:112">112</a>.</p>
    </main>
  );
}
