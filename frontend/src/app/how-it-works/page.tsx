"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Sliders,
  Palette,
  FileCheck,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      icon: Sliders,
      title: "Parametric Configuration",
      desc: "Select your print division and dial in exact millimeters for width and height. Pick from our specialized material stocks, finishes, and batch quantities with live debounced pricing down to integer paise.",
    },
    {
      step: "02",
      icon: Palette,
      title: "Browser Design or High-Res Artwork Upload",
      desc: "Customize in our web designer with automated print-safe snapping, dynamic font shrinking, and bleed line overlays. Alternatively, upload pre-flighted PDF, AI, or vector PNG files.",
    },
    {
      step: "03",
      icon: FileCheck,
      title: "Digital Proof Inspection & Approval Gate",
      desc: "Review your vector proof with toggleable 3mm bleed guides and safe margins. Approve to unlock certified print files, or request revisions with direct feedback notes.",
    },
    {
      step: "04",
      icon: Truck,
      title: "Industrial Production & Express Dispatch",
      desc: "Orders immediately queue on the production floor with certified 300 DPI vector geometry and automated variable data merging.",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <div className="bg-soft-gradient border-b border-line py-14 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Engineered For Precision
          </span>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-plum tracking-tight">
            How DigiVio Works
          </h1>
          <p className="text-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
            From parametric specification to industrial printing press: transparent, error-free, and subscription-free.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-16">
        <div className="space-y-12">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="flex flex-col md:flex-row items-start gap-6 p-8 rounded-card bg-surface-card border border-line shadow-soft"
              >
                <div className="w-14 h-14 rounded-btn bg-lavender flex items-center justify-center text-primary font-heading font-extrabold text-xl shrink-0 shadow-soft">
                  {s.step}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h3 className="font-heading font-bold text-xl text-plum">{s.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-card bg-hero-gradient p-8 text-white text-center space-y-4 shadow-lift">
          <h3 className="font-heading font-extrabold text-2xl">Ready to test our live engine?</h3>
          <p className="text-xs sm:text-sm text-lavender/80 max-w-md mx-auto">
            Choose any product to configure dimensions and preview your instant volume discount.
          </p>
          <div className="pt-2">
            <Link href="/products" className="inline-block w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Catalogue
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
