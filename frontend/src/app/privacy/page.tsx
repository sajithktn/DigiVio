"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <div className="bg-soft-gradient border-b border-line py-12 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <h1 className="font-heading font-extrabold text-3xl text-plum">Privacy Policy</h1>
          <p className="text-xs text-ink-muted">Last updated: November 2026</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full text-xs text-ink leading-relaxed space-y-6">
        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">1. Information We Collect</h3>
          <p className="text-ink-muted">
            We collect personal information necessary to fulfill print orders, generate tax invoices, and ship finished physical products, including your name, email, delivery address, and company details.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">2. Customer Isolation & Data Security</h3>
          <p className="text-ink-muted">
            Customer artwork, proofs, and CSV variable-data rosters are isolated with PostgreSQL Row Level Security (RLS) and signed, time-limited storage tokens. DigiVio never shares or sells your files to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">3. Payment Information</h3>
          <p className="text-ink-muted">
            Credit card and payment credentials are processed directly by Stripe using encrypted PCI-DSS compliant infrastructure. DigiVio never stores full card numbers on our servers.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
