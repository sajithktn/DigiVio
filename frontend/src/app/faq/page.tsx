"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChevronDown } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the digital proof approval gate work?",
      a: "Before any job is sent to physical press production, DigiVio generates a 300 DPI vector digital proof showing exact trim bounds, safe margins, and 3mm bleed limits. You must inspect and click 'Approve Proof' in your dashboard to unlock the print-ready files. If you notice any error, simply click 'Request Changes' with your feedback.",
    },
    {
      q: "Is there a monthly subscription fee?",
      a: "No. DigiVio is 100% subscription-free. You only pay per order with transparent, parametric pricing that automatically incorporates volume tier discounts (up to 25% savings).",
    },
    {
      q: "What file formats can I upload for custom artwork?",
      a: "Our preflight engine accepts PDF, PNG, SVG, and Adobe Illustrator (AI) files up to 25 MB. We recommend exporting artwork at 300 DPI in CMYK with text converted to outlines.",
    },
    {
      q: "How does the race bib variable data (CSV) merge work?",
      a: "For Race & Event Numbers products, you can upload a CSV spreadsheet containing runner numbers, names, and categories. Our server-side engine automatically renders individual vector bibs for every row in your file and bundles them into an organized ZIP archive.",
    },
    {
      q: "How does one-click reordering work?",
      a: "All your configured specs and approved artwork are permanently saved in your customer hub under 'Saved Designs' and 'Orders'. Clicking 'Reorder' instantly clones the configuration, re-checks current volume pricing, and creates a fresh print batch without redesigning.",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <div className="bg-soft-gradient border-b border-line py-12 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Help & Guidelines
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-plum tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-ink-muted max-w-xl mx-auto">
            Everything you need to know about our web-to-print pipeline, proofing gates, and file delivery.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-card bg-surface-card border border-line shadow-soft overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-sm text-plum hover:text-primary transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-ink-muted shrink-0 transition-transform ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-ink-muted leading-relaxed border-t border-line/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </main>

      <Footer />
    </div>
  );
}
