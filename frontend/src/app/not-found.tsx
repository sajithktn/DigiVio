"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Printer, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <main className="max-w-lg mx-auto my-auto p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-lavender flex items-center justify-center text-primary mx-auto shadow-soft">
          <Printer className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            404 Error
          </span>
          <h1 className="font-heading font-extrabold text-3xl text-plum">
            Page Not Found
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed">
            The page you are looking for does not exist or has been moved to another location.
          </p>
        </div>

        <div>
          <Link href="/">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Back to Store Home
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
