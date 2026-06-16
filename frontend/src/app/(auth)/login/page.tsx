"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof LoginSchema>, string>>;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setServerError(data.error ?? "Login failed. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-8">
      <h1 className="text-[28px] font-extrabold text-[var(--ms-txt)] tracking-[-0.8px] mb-2">
        Welcome back
      </h1>
      <p className="text-[15px] text-[var(--ms-txt2)] mb-8 leading-snug">
        Sign in to your MedSafe account
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[15px] text-base text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-[var(--ms-red)]">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[15px] text-base text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
          />
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-sm text-[var(--ms-red)]">
              {errors.password}
            </p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-[var(--ms-red)] bg-[var(--ms-red-bg)] rounded-xl px-4 py-3">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[17px] text-[17px] font-semibold tracking-[-0.3px] disabled:opacity-50 mt-2"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-5 text-center text-[14px] text-[var(--ms-txt2)]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[var(--ms-acc)] font-semibold no-underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
