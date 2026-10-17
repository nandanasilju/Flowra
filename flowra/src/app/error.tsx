"use client";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sand-600">Your saved logs are safe. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
