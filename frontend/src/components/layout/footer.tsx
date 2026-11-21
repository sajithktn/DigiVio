"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Printer, ShieldCheck, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { DIVISIONS } from "@/lib/divisions";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-deep text-lavender pt-14 pb-10 border-t border-deep/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
          {/* Brand Info (Cols 1-4) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-deep rounded-[10px] flex items-center justify-center text-white">
                  <Printer className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-white">
                Digi<span className="text-secondary">Vio</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-lavender/80 max-w-sm leading-relaxed">
              Industrial precision web-to-print engine. Subscription-free per-order pricing,
              instant in-browser canvas customization, certified 300 DPI prepress proofs, and express physical production.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 border border-white/10 text-xs text-lavender">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                <span>300 DPI File Guarantee</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 border border-white/10 text-xs text-lavender">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>100% Pay Per Order</span>
              </div>
            </div>
          </div>

          {/* Print Divisions (Cols 5-7) */}
          <div className="sm:col-span-1 lg:col-span-3 space-y-3">
            <h4 className="font-heading font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
              Print Divisions
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-lavender/80">
              {DIVISIONS.map((div) => (
                <li key={div.slug}>
                  <Link
                    href={`/products?division=${div.slug}`}
                    className="hover:text-white hover:underline transition-colors decoration-secondary underline-offset-4 flex items-center justify-between group"
                  >
                    <span>{div.name}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-secondary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform & Solutions (Cols 8-9) */}
          <div className="sm:col-span-1 lg:col-span-2 space-y-3">
            <h4 className="font-heading font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-lavender/80">
              <li>
                <Link href="/gallery" className="hover:text-white hover:underline decoration-secondary">
                  Work Showcase
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white hover:underline decoration-secondary">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white hover:underline decoration-secondary">
                  Live Calculator
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:underline decoration-secondary">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:underline decoration-secondary">
                  FAQ & Prepress Help
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Updates (Cols 10-12) */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-3">
            <h4 className="font-heading font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
              Stay In The Loop
            </h4>
            <p className="text-xs text-lavender/70 leading-relaxed">
              Get volume discount schedule updates, custom stock arrivals, and prepress tips delivered to your inbox.
            </p>

            {subscribed ? (
              <div className="p-3 rounded-btn bg-white/10 border border-secondary/40 text-xs text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                <span>Thank you! You are now subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-btn bg-white/10 border border-white/20 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-lavender/50 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to updates"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-btn bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition active:scale-95"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-lavender/60 text-center md:text-left">
          <p>© {new Date().getFullYear()} DigiVio Web-to-Print Engine. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <span className="flex items-center gap-1.5 text-lavender/80">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              256-bit Encrypted Checkout
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
