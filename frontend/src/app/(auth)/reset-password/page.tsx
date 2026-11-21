"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { resetPassword } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract reset token from URL query, hash fragment, or session
  React.useEffect(() => {
    let t = searchParams.get("token") || searchParams.get("access_token");

    if (!t && typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      t = hashParams.get("access_token") || hashParams.get("token");
    }

    if (!t && typeof window !== "undefined") {
      t = localStorage.getItem("digivio_token");
    }

    setToken(t || null);
    setIsTokenChecking(false);
  }, [searchParams]);

  // Live password checklist
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError("Password must be at least 8 characters with 1 uppercase letter and 1 number");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Password reset token is missing or expired. Please request a new link.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(password, token);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired or is invalid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTokenChecking && !token && !isSuccess) {
    return (
      <AuthShell
        title="Invalid Recovery Link"
        subtitle="We could not verify your password reset authorization token"
      >
        <div className="space-y-5 text-center py-2">
          <Alert variant="error" title="Missing or Expired Token">
            This password recovery link is either invalid, expired, or has already been used. Please submit a new request.
          </Alert>
          <div className="space-y-2.5 pt-2">
            <Link href="/forgot-password" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Request New Password Link
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="secondary" size="md" className="w-full text-xs">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Ensure your new password meets the security requirements"
    >
      {isSuccess ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-bold text-plum">
              Password Updated
            </h3>
            <p className="text-sm text-ink-muted">
              Your password has been successfully updated. Redirecting to sign in...
            </p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button variant="primary" size="lg" className="w-full">
              Sign In to DigiVio
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="error" title="Reset Error">
              {error}
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reset-new-password" requiredIndicator>
              New Password
            </Label>
            <Input
              id="reset-new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-ink-muted hover:text-ink p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Password Requirement Rules */}
            <div className="p-3 bg-lavender-light rounded-btn text-xs space-y-1.5 mt-2">
              <span className="font-semibold text-ink text-[11px] block uppercase tracking-wider">
                Password Requirements:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? "text-success font-medium" : "text-ink-muted"
                  }`}
                >
                  <span>{hasMinLength ? "✓" : "○"} 8+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasUppercase ? "text-success font-medium" : "text-ink-muted"
                  }`}
                >
                  <span>{hasUppercase ? "✓" : "○"} 1 uppercase</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? "text-success font-medium" : "text-ink-muted"
                  }`}
                >
                  <span>{hasNumber ? "✓" : "○"} 1 number</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm-password" requiredIndicator>
              Confirm New Password
            </Label>
            <Input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="text-ink-muted hover:text-ink p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            {confirmPassword.length > 0 && (
              <p
                className={`text-xs mt-1 ${
                  passwordsMatch ? "text-success font-medium" : "text-danger font-medium"
                }`}
              >
                {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Update password
          </Button>

          <div className="text-center pt-3 border-t border-line/60">
            <Link
              href="/login"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Cancel and return to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
          Loading reset password...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
