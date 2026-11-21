"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar, DIVISIONS } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { ArrowRight, Calculator, Check, Sparkles } from "lucide-react";

export default function PricingCalculatorPage() {
  const [division, setDivision] = useState("labels-stickers");
  const [widthMm, setWidthMm] = useState(90);
  const [heightMm, setHeightMm] = useState(50);
  const [quantity, setQuantity] = useState(250);

  const [quote, setQuote] = useState({
    unitPriceMinor: 199,
    subtotalMinor: 49750,
    taxIncludedMinor: 7589,
    savingsPct: 15,
  });

  useEffect(() => {
    const areaCm2 = (widthMm / 10) * (heightMm / 10);
    const baseMinor = division === "race-event-numbers" ? 4500 : 3000;
    const ratePerCm2Minor = 8;
    const unitBeforeDisc = baseMinor + areaCm2 * ratePerCm2Minor;

    let disc = 0;
    if (quantity >= 1000) disc = 25;
    else if (quantity >= 500) disc = 20;
    else if (quantity >= 250) disc = 15;
    else if (quantity >= 100) disc = 10;

    const unitPriceMinor = Math.round(unitBeforeDisc * (1 - disc / 100));
    const subtotalMinor = unitPriceMinor * quantity + 5000;
    const taxIncludedMinor = Math.round((subtotalMinor * 0.18) / 1.18);

    setQuote({
      unitPriceMinor,
      subtotalMinor,
      taxIncludedMinor,
      savingsPct: disc,
    });
  }, [division, widthMm, heightMm, quantity]);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <div className="bg-soft-gradient border-b border-line py-12 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Deterministic Engine
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-plum tracking-tight">
            Instant Parametric Pricing Calculator
          </h1>
          <p className="text-sm text-ink-muted max-w-xl mx-auto">
            Test any custom size or volume schedule. All quotes include GST and are guaranteed at checkout.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="rounded-card bg-surface-card border border-line shadow-card p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Print Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full rounded-btn border border-line p-3 text-xs font-semibold text-ink outline-none focus:border-primary"
              >
                {DIVISIONS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Batch Quantity
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-btn border border-line p-3 text-xs font-semibold text-ink outline-none focus:border-primary"
              >
                <option value={50}>50 units (Standard)</option>
                <option value={100}>100 units (10% Tier Discount)</option>
                <option value={250}>250 units (15% Tier Discount)</option>
                <option value={500}>500 units (20% Tier Discount)</option>
                <option value={1000}>1,000 units (25% Tier Discount)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Width (mm)
              </label>
              <input
                type="number"
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                min={20}
                max={1200}
                className="w-full rounded-btn border border-line p-3 text-xs font-semibold tabular-nums text-ink outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Height (mm)
              </label>
              <input
                type="number"
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                min={20}
                max={1200}
                className="w-full rounded-btn border border-line p-3 text-xs font-semibold tabular-nums text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="p-6 rounded-card bg-lavender-light border border-line flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs text-ink-muted">Estimated Payable Total:</span>
                {quote.savingsPct > 0 && (
                  <Badge variant="primary">Save {quote.savingsPct}%</Badge>
                )}
              </div>
              <PriceTag amountMinor={quote.subtotalMinor} size="xl" />
              <p className="text-[11px] text-ink-muted">
                Unit Rate: ₹{(quote.unitPriceMinor / 100).toFixed(2)}/unit · GST: ₹{(quote.taxIncludedMinor / 100).toFixed(2)}
              </p>
            </div>

            <Link href={`/products?division=${division}`} className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Open Full Configurator
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
