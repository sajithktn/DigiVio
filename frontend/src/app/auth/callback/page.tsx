"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState("Verifying authentication session...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        let token = searchParams.get("access_token");
        let type = searchParams.get("type");
        let errorCode = searchParams.get("error_code") || searchParams.get("error");
        let errorDesc = searchParams.get("error_description");

        // Parse from hash if present (Supabase implicit grant)
        if (typeof window !== "undefined" && window.location.hash) {
          const hashStr = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hashStr);

          if (!token && hashParams.get("access_token")) {
            token = hashParams.get("access_token");
          }
          if (!type && hashParams.get("type")) {
            type = hashParams.get("type");
          }
          if (!errorCode && (hashParams.get("error_code") || hashParams.get("error"))) {
            errorCode = hashParams.get("error_code") || hashParams.get("error");
          }
          if (!errorDesc && hashParams.get("error_description")) {
            errorDesc = hashParams.get("error_description");
          }
        }

        // Handle error state (e.g., expired verification or recovery link)
        if (errorCode || errorDesc) {
          setState("error");
          if (errorCode === "otp_expired" || errorDesc?.toLowerCase().includes("expired")) {
            setErrorMessage("This verification or recovery link has expired or has already been used. Please request a new link.");
          } else {
            setErrorMessage(errorDesc || "Authentication callback encountered an error. Please try signing in again.");
          }
          return;
        }

        // Handle Password Recovery callback
        if (type === "recovery" && token) {
          localStorage.setItem("digivio_token", token);
          router.replace(`/reset-password?access_token=${encodeURIComponent(token)}`);
          return;
        }

        // Handle Signup / Email Verification or Magic Link session
        if (token) {
          localStorage.setItem("digivio_token", token);
          setStatusMessage("Email confirmed. Loading your workspace...");
          const profile = await refreshProfile();
          setState("success");
          setStatusMessage("Email verified successfully! Welcome to DigiVio.");

          setTimeout(() => {
            if (profile?.role === "admin") {
              router.replace("/admin");
            } else {
              router.replace("/dashboard");
            }
          }, 1500);
        } else {
          // No token or error in URL
          setState("error");
          setErrorMessage("No authentication token found in callback. Please sign in directly.");
        }
      } catch (e: any) {
        setState("error");
        setErrorMessage(e.message || "Failed to process authentication session. Please sign in again.");
      }
    };

    handleAuthCallback();
  }, [router, searchParams, refreshProfile]);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface-card border border-line rounded-card shadow-soft p-8 space-y-6">
        {state === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <h2 className="font-heading text-xl font-bold text-plum">
              Confirming Your Account
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              {statusMessage}
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto text-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-xl font-bold text-plum">
              Email Verified!
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              {statusMessage}
            </p>
            <Link href="/dashboard" className="block pt-2">
              <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto text-danger">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-xl font-bold text-plum">
              Verification Failed
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              {errorMessage}
            </p>
            <div className="space-y-2 pt-2">
              <Link href="/verify-email" className="block">
                <Button variant="secondary" size="md" className="w-full text-xs">
                  Resend Verification Email
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
          Verifying session...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
