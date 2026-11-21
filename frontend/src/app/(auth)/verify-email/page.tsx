"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { Mail, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const { resendVerification } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await resendVerification(email.trim());
      setSuccessMessage(msg);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Activate your DigiVio account to access all features"
    >
      <div className="space-y-5">
        {successMessage ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto text-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-plum">
                Verification Link Dispatched
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {successMessage}
              </p>
              <p className="text-xs text-ink-muted/80">
                Please check both your inbox and spam folder for an activation email from DigiVio.
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <Link href="/login" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <Alert variant="error" title="Request Failed">
                {error}
              </Alert>
            )}

            <div className="p-3.5 bg-lavender-light border border-line rounded-card text-xs text-ink-muted space-y-1.5 leading-relaxed">
              <p className="font-semibold text-ink">
                Need a new verification link?
              </p>
              <p>
                Enter your registered email address below, and we will send you a fresh verification link to activate your account.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="verify-email" requiredIndicator>
                Registered Email Address
              </Label>
              <Input
                id="verify-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Verification Email
            </Button>

            <div className="text-center pt-3 border-t border-line/60">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
          Loading verification...
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
