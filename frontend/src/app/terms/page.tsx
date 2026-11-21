"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <div className="bg-soft-gradient border-b border-line py-12 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <h1 className="font-heading font-extrabold text-3xl text-plum">Terms of Service</h1>
          <p className="text-xs text-ink-muted">Last updated: November 2026</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full text-xs text-ink leading-relaxed space-y-6">
        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">1. Acceptance of Terms</h3>
          <p className="text-ink-muted">
            By accessing or using the DigiVio platform, you agree to be bound by these Terms of Service. DigiVio provides subscription-free on-demand web-to-print manufacturing services.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">2. Digital Proof Approval Gate</h3>
          <p className="text-ink-muted">
            Customer understands that production file generation is strictly gated by customer proof approval. Once a digital proof is approved, the order advances to the factory floor and modifications cannot be made without incurring setup fees.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">3. Pricing and GST</h3>
          <p className="text-ink-muted">
            All quoted prices are inclusive of 18% Goods and Services Tax (GST) in Indian Rupees (INR). Payments are processed securely via Stripe.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-plum">4. Intellectual Property & Artwork Ownership</h3>
          <p className="text-ink-muted">
            Customers retain 100% intellectual property ownership of uploaded artwork and designs. Customer warrants they hold full legal rights to print submitted designs and logos.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
