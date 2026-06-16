"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { CONSENT_SCREEN, MEDICAL_DISCLAIMER } from "@/lib/legal";

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  consent_given: z.literal(true, "You must accept the terms to continue"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof SignupSchema>, string>>;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = SignupSchema.safeParse({
      name,
      email,
      password,
      consent_given: consentGiven || undefined,
    });

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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, consent_given: true, wants_notifications: wantsNotifications }),
      });
      const data = await res.json();

      if (!data.success) {
        setServerError(data.error ?? "Signup failed. Please try again.");
        return;
      }

      if (data.data.requiresConfirmation) {
        setConfirmationPending(true);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmationPending) {
    return (
      <div className="bg-[var(--ms-surf)] rounded-2xl p-6 border border-[var(--ms-bord)]">
        <div className="w-12 h-12 rounded-2xl bg-[var(--ms-grn-bg)] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#2ECC8F">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--ms-txt)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--ms-txt2)] leading-relaxed mb-4">
          We sent a confirmation link to <strong className="text-[var(--ms-txt)]">{email}</strong>. Click it to activate your account.
        </p>
        <p className="text-sm text-[var(--ms-txt2)]">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            className="text-[var(--ms-acc)] font-semibold bg-transparent border-none cursor-pointer p-0"
            onClick={() => setConfirmationPending(false)}
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <h1 className="text-[28px] font-extrabold text-[var(--ms-txt)] tracking-[-0.8px] mb-2">
        Create account
      </h1>
      <p className="text-[15px] text-[var(--ms-txt2)] mb-8 leading-snug">
        Start protecting your family&apos;s medicines today
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2">
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Arjun Kumar"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[15px] text-base text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
          />
          {errors.name && <p id="name-error" className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.name}</p>}
        </div>

        {/* Email */}
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
          {errors.email && <p id="email-error" className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="8+ characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[15px] text-base text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
          />
          {errors.password && <p id="password-error" className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.password}</p>}
        </div>

        {/* Consent — DPDPA 2023 */}
        <div className="bg-[var(--ms-surf)] rounded-2xl p-4 border border-[var(--ms-bord)] flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-[var(--ms-txt)]">{CONSENT_SCREEN.title}</p>
          <p className="text-xs text-[var(--ms-txt2)] leading-relaxed">{CONSENT_SCREEN.intro}</p>
          <p className="text-xs text-[var(--ms-txt2)] leading-relaxed">{CONSENT_SCREEN.medicalNotice}</p>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="consent"
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              aria-describedby={errors.consent_given ? "consent-error" : undefined}
              className="mt-0.5 accent-[#4F8EFF] w-4 h-4 flex-shrink-0"
            />
            <span className="text-xs text-[var(--ms-txt2)] leading-relaxed">
              {CONSENT_SCREEN.checkboxes.terms}
            </span>
          </label>
          {errors.consent_given && (
            <p id="consent-error" className="text-sm text-[var(--ms-red)]">{errors.consent_given}</p>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="notifications"
              type="checkbox"
              checked={wantsNotifications}
              onChange={(e) => setWantsNotifications(e.target.checked)}
              className="mt-0.5 accent-[#4F8EFF] w-4 h-4 flex-shrink-0"
            />
            <span className="text-xs text-[var(--ms-txt2)] leading-relaxed">
              {CONSENT_SCREEN.checkboxes.notifications}
            </span>
          </label>
        </div>

        <p className="text-xs text-[var(--ms-txt3)] leading-relaxed">{MEDICAL_DISCLAIMER.footer}</p>

        {serverError && (
          <p role="alert" className="text-sm text-[var(--ms-red)] bg-[var(--ms-red-bg)] rounded-xl px-4 py-3">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[17px] text-[17px] font-semibold tracking-[-0.3px] disabled:opacity-50 mt-1"
        >
          {loading ? "Creating account…" : "Create My Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-[14px] text-[var(--ms-txt2)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--ms-acc)] font-semibold no-underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
