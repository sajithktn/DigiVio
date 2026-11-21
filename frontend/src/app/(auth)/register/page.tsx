"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import {
  User,
  Mail,
  Building,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, resendVerification, user, isAuthenticated, isLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    requiresVerification: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Redirect already authenticated users away from register
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleResend = async () => {
    if (!email.trim()) return;
    setIsResending(true);
    try {
      const msg = await resendVerification(email.trim());
      setResendStatus(msg);
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  // Live password validation checklist
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters long";
    }

    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please provide a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (!isPasswordValid) {
      errors.password =
        "Password must be at least 8 characters with 1 uppercase letter and 1 number";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      errors.terms = "You must agree to the Terms of Service to create an account";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        company_name: companyName.trim() || undefined,
        password,
      });

      if (result.requiresVerification) {
        setSuccessInfo({
          message: result.message,
          requiresVerification: true,
        });
      } else {
        // Direct session created -> redirect to customer dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setServerError(
        err.message || "Failed to create account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start designing and ordering with instant parametric pricing"
    >
      {successInfo ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-bold text-plum">
              Check your inbox
            </h3>
            <p className="text-sm text-ink-muted">
              {successInfo.message}
            </p>
            <p className="text-xs text-ink-muted/80">
              We&apos;ve dispatched a confirmation link to{" "}
              <strong className="text-ink">{email}</strong>. Once verified, you
              can log in to your dashboard.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            {resendStatus ? (
              <p className="text-xs font-semibold text-primary">{resendStatus}</p>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleResend}
                isLoading={isResending}
                className="w-full text-xs"
              >
                Resend Verification Link
              </Button>
            )}
            <Link href="/login" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && (
            <Alert variant="error" title="Registration Failed">
              {serverError}
            </Alert>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="register-name" requiredIndicator>
              Full Name
            </Label>
            <Input
              id="register-name"
              placeholder="Alex Morgan"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined! }));
                }
              }}
              error={fieldErrors.fullName}
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="register-email" requiredIndicator>
              Work or Personal Email
            </Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined! }));
                }
              }}
              error={fieldErrors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          {/* Company Name (Optional) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="register-company">Company / Team</Label>
              <span className="text-[11px] text-ink-muted">Optional</span>
            </div>
            <Input
              id="register-company"
              placeholder="Acme Racing / Studio Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="register-password" requiredIndicator>
              Password
            </Label>
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined! }));
                }
              }}
              error={fieldErrors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded p-1 transition-colors"
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
                  {hasMinLength ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-ink-muted/60" />
                  )}
                  <span>8+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasUppercase ? "text-success font-medium" : "text-ink-muted"
                  }`}
                >
                  {hasUppercase ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-ink-muted/60" />
                  )}
                  <span>1 uppercase</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? "text-success font-medium" : "text-ink-muted"
                  }`}
                >
                  {hasNumber ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-ink-muted/60" />
                  )}
                  <span>1 number</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label htmlFor="register-confirm-password" requiredIndicator>
              Confirm Password
            </Label>
            <Input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined!,
                  }));
                }
              }}
              error={fieldErrors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded p-1 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <Checkbox
              id="agree-terms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (fieldErrors.terms) {
                  setFieldErrors((prev) => ({ ...prev, terms: undefined! }));
                }
              }}
              label={
                <span className="text-xs">
                  I agree to DigiVio&apos;s{" "}
                  <Link
                    href="/terms"
                    className="text-primary hover:underline font-semibold"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline font-semibold"
                  >
                    Privacy Policy
                  </Link>
                </span>
              }
            />
            {fieldErrors.terms && (
              <p className="text-xs text-danger mt-1 font-medium">
                {fieldErrors.terms}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create your account
          </Button>

          {/* Link to Login */}
          <p className="text-center text-xs text-ink-muted pt-4 border-t border-line/60">
            Already have a DigiVio account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:text-primary-hover underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-1"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
