"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { LoginSchema, RegisterSchema } from "@/lib/types";
import type { z } from "zod";

type Mode = "login" | "register";

export function WelcomeClient({ initialMode, autoDemo }: { initialMode: "login" | "register"; autoDemo: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [serverError, setServerError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const registerForm = useForm<z.infer<typeof RegisterSchema>>({ resolver: zodResolver(RegisterSchema), defaultValues: { name: "", email: "", password: "" } });
  const loginForm = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });

  const afterAuth = (consented: boolean) => {
    router.replace(consented ? "/home" : "/consent");
    router.refresh();
  };

  const onRegister = registerForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiFetch("/api/auth/register", { method: "POST", json: values });
      afterAuth(false);
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  const onLogin = loginForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await apiFetch<{ user: { consentAt: string | null } }>("/api/auth/login", { method: "POST", json: values });
      afterAuth(Boolean(res.user.consentAt));
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  const tryDemo = async () => {
    setServerError(null);
    setDemoLoading(true);
    try {
      await apiFetch("/api/auth/demo", { method: "POST" });
      afterAuth(false);
    } catch (e) {
      setServerError(errorMessage(e));
      setDemoLoading(false);
    }
  };

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoDemo && !autoRan.current) {
      autoRan.current = true;
      void tryDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDemo]);

  const busy = registerForm.formState.isSubmitting || loginForm.formState.isSubmitting || demoLoading;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-8">
      <section className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label="Flowra home"><Logo className="scale-125" /></Link>
        <h1 className="mt-2 text-2xl font-bold text-sand-800">Your cycle, understood.</h1>
        <p className="max-w-sm text-sand-600">
          Track your periods and symptoms, by voice in English, हिन्दी or മലയാളം, and know when it may be worth seeing a doctor.
        </p>
      </section>

      <Button size="lg" variant="teal" onClick={tryDemo} disabled={busy}>
        {demoLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} Try demo account
      </Button>
      <p className="-mt-4 text-center text-xs text-sand-600">Creates a private demo login with sample data (“Anjali”, 3 cycles).</p>

      <Card>
        <CardContent className="pt-4">
          <div role="tablist" aria-label="Account" className="mb-4 grid grid-cols-2 rounded-md bg-sand-100 p-1">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setServerError(null);
                }}
                className={`h-10 rounded text-sm font-semibold ${mode === m ? "bg-white text-plum-700 shadow" : "text-sand-600"}`}
              >
                {m === "register" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          {mode === "register" ? (
            <form onSubmit={onRegister} className="flex flex-col gap-3" noValidate>
              <div className="flex flex-col gap-1">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" autoComplete="given-name" {...registerForm.register("name")} />
                {registerForm.formState.errors.name && <p className="text-sm text-red-700">{registerForm.formState.errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...registerForm.register("email")} />
                {registerForm.formState.errors.email && <p className="text-sm text-red-700">{registerForm.formState.errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...registerForm.register("password")} />
                {registerForm.formState.errors.password && <p className="text-sm text-red-700">{registerForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={busy}>
                {registerForm.formState.isSubmitting && <Loader2 className="animate-spin" />} Create account
              </Button>
            </form>
          ) : (
            <form onSubmit={onLogin} className="flex flex-col gap-3" noValidate>
              <div className="flex flex-col gap-1">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" autoComplete="email" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && <p className="text-sm text-red-700">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" autoComplete="current-password" {...loginForm.register("password")} />
                {loginForm.formState.errors.password && <p className="text-sm text-red-700">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={busy}>
                {loginForm.formState.isSubmitting && <Loader2 className="animate-spin" />} Sign in
              </Button>
              <Link href="/forgot-password" className="text-sm font-semibold text-plum-600">Forgot password?</Link>
              <p className="text-xs text-sand-600">Seeded demo logins: demo@flowra.app, riya@flowra.app or mild@flowra.app, password demo1234.</p>
            </form>
          )}
          {serverError && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-800">
              {serverError}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs text-sand-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        Voice recordings are never stored. Your health data is never sold or shared. Flowra is a tracking aid, not a diagnosis.
      </p>
    </main>
  );
}
