"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, User } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const { login, resendVerification, user, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRedirect = (role: "customer" | "admin") => {
    if (redirectTarget) {
      router.push(redirectTarget);
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  // Redirect already authenticated users away from sign-in
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      handleRedirect(user?.role || "customer");
    }
  }, [isLoading, isAuthenticated, user]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsUnverified(false);
    setResendStatus(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      handleRedirect(loggedUser?.role || "customer");
    } catch (err: any) {
      if (err.code === "EMAIL_NOT_VERIFIED" || err.message?.toLowerCase().includes("not been verified")) {
        setIsUnverified(true);
        setServerError("Your email address has not been verified yet.");
      } else {
        setServerError(
          err.message || "Invalid email or password. Please verify your credentials."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setIsResending(true);
    try {
      const msg = await resendVerification(email.trim());
      setResendStatus(msg);
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };



  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your DigiVio account to manage orders and designs"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && (
          <div className="space-y-3">
            <Alert variant="error" title={isUnverified ? "Email Not Verified" : "Sign In Error"}>
              {serverError}
            </Alert>
            {isUnverified && (
              <div className="p-3.5 bg-lavender-light border border-line rounded-card space-y-2">
                <p className="text-xs text-ink-muted">
                  Please check your inbox and spam folder for the activation link. If you didn&apos;t receive it, click below to request a new one.
                </p>
                {resendStatus ? (
                  <p className="text-xs font-semibold text-primary">{resendStatus}</p>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleResend}
                    isLoading={isResending}
                    className="text-xs"
                  >
                    Resend Verification Email
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="login-email" requiredIndicator>
            Email Address
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={fieldErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" requiredIndicator>
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
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
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label="Remember me on this browser"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign in to DigiVio
        </Button>



        {/* Link to Register */}
        <p className="text-center text-xs text-ink-muted pt-4 border-t border-line/60">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-bold text-primary hover:text-primary-hover underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-1"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
          Loading DigiVio sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
