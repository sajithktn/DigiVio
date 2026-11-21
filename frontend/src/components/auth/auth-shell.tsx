import React from "react";
import Link from "next/link";
import { Sparkles, Layers, ShieldCheck, Printer, CheckCircle2 } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-bg">
      {/* Left Hero Panel (Sneaker-store aesthetic with deep purple contrast) */}
      <div className="relative w-full lg:w-[48%] xl:w-[45%] bg-hero-gradient p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden shrink-0">
        {/* Soft atmospheric gradient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet rounded-lg"
          >
            <div className="w-10 h-10 rounded-btn bg-promo-gradient flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-2xl tracking-tight text-white flex items-center gap-1.5">
                Digi<span className="text-violet">Vio</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-lavender/70 font-semibold -mt-1">
                Web-to-Print Studio
              </span>
            </div>
          </Link>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-10 lg:my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-lavender/10 border border-lavender/20 backdrop-blur-md text-lavender text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-violet" />
            <span>Modern · Creative · Premium · Minimal</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-[1.15] tracking-tight">
            Print that looks as{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet to-lavender">
              good as your idea.
            </span>
          </h1>

          <p className="text-lavender/80 text-sm sm:text-base leading-relaxed">
            Subscription-free, per-order web-to-print across 6 specialized divisions: stickers, event bibs, MTB boards, stamps, awards, and laser-cut work.
          </p>

          {/* Floating Product Spec Card (Sneaker Store Composition) */}
          <div className="pt-4">
            <div className="bg-plum/60 border border-line/20 rounded-card p-5 backdrop-blur-md shadow-card relative overflow-hidden group">
              <div className="flex items-center justify-between pb-3 border-b border-line/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-violet animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-lavender">
                    Print-Ready Pipeline
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-pill bg-primary/30 text-lavender border border-primary/40">
                  CMYK + 300 DPI
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3.5">
                <div className="flex items-center gap-2 text-xs text-lavender/90">
                  <CheckCircle2 className="w-4 h-4 text-violet shrink-0" />
                  <span>Instant Parametric Pricing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-lavender/90">
                  <CheckCircle2 className="w-4 h-4 text-violet shrink-0" />
                  <span>Real-Time Proofing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-lavender/90">
                  <CheckCircle2 className="w-4 h-4 text-violet shrink-0" />
                  <span>Zero Subscription Lock-in</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-lavender/90">
                  <CheckCircle2 className="w-4 h-4 text-violet shrink-0" />
                  <span>One-Click Repeat Reorders</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Trust Markers */}
        <div className="relative z-10 pt-6 border-t border-line/10 flex flex-wrap items-center justify-between gap-4 text-xs text-lavender/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet" />
            <span>Production-grade output</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet" />
            <span>6 Dedicated Divisions</span>
          </div>
          <span>© 2026 DigiVio</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-plum tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-ink-muted">{subtitle}</p>
          </div>

          <div className="bg-surface-card rounded-card border border-line shadow-soft p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
