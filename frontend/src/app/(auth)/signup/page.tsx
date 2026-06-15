"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONSENT_SCREEN, MEDICAL_DISCLAIMER } from "@/lib/legal";

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  consent_given: z.literal(true, "You must accept the terms to continue"),
});

type FormErrors = Partial<
  Record<keyof z.infer<typeof SignupSchema>, string>
>;

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
        body: JSON.stringify({
          name,
          email,
          password,
          consent_given: true,
          wants_notifications: wantsNotifications,
        }),
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
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => setConfirmationPending(false)}
            >
              try again
            </button>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Free medicine tracker for your household
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Priya Sharma"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* Consent section — DPDPA 2023 compliance */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-medium">{CONSENT_SCREEN.title}</p>
            <p className="text-xs text-muted-foreground">{CONSENT_SCREEN.intro}</p>
            <p className="text-xs text-muted-foreground">
              {CONSENT_SCREEN.medicalNotice}
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) =>
                    setConsentGiven(checked === true)
                  }
                  aria-describedby={
                    errors.consent_given ? "consent-error" : undefined
                  }
                />
                <Label
                  htmlFor="consent"
                  className="text-xs leading-relaxed cursor-pointer"
                >
                  {CONSENT_SCREEN.checkboxes.terms}
                </Label>
              </div>
              {errors.consent_given && (
                <p id="consent-error" className="text-sm text-destructive">
                  {errors.consent_given}
                </p>
              )}

              <div className="flex items-start gap-3">
                <Checkbox
                  id="notifications"
                  checked={wantsNotifications}
                  onCheckedChange={(checked) =>
                    setWantsNotifications(checked === true)
                  }
                />
                <Label
                  htmlFor="notifications"
                  className="text-xs leading-relaxed cursor-pointer"
                >
                  {CONSENT_SCREEN.checkboxes.notifications}
                </Label>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {MEDICAL_DISCLAIMER.footer}
          </p>

          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
