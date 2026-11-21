"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await forgotPassword(email.trim());
      setSuccessMessage(msg);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email associated with your account and we'll send a recovery link"
    >
      {isSent ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-bold text-plum">
              Reset Link Sent
            </h3>
            <p className="text-sm text-ink-muted">{successMessage}</p>
            <p className="text-xs text-ink-muted/80">
              Please check your spam folder if you do not receive it within a few minutes.
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full text-xs"
              onClick={() => setIsSent(false)}
            >
              Try another email address
            </Button>
            <Link href="/login" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Back to Sign In
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

          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" requiredIndicator>
              Account Email Address
            </Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
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
            Send recovery link
          </Button>

          <div className="text-center pt-3 border-t border-line/60">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
