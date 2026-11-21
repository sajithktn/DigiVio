"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar, DIVISIONS } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard, ProductSummary } from "@/components/products/product-card";
import { api } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  FileCheck,
  Repeat,
  Zap,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Calculator,
  Eye,
  Tag,
  Award,
  Bike,
  Stamp,
} from "lucide-react";

const DIVISION_ICONS: Record<string, React.ElementType> = {
  "labels-stickers": Tag,
  "race-event-numbers": Award,
  "mtb-boards": Bike,
  stamps: Stamp,
  trophies: Sparkles,
  "laser-cut-work": Layers,
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductSummary[]>([]);
  const [activeGalleryDivision, setActiveGalleryDivision] = useState<string>("all");

  // Instant price calculator teaser states
  const [calcDivision, setCalcDivision] = useState<string>("labels-stickers");
  const [calcWidth, setCalcWidth] = useState<number>(90);
  const [calcHeight, setCalcHeight] = useState<number>(50);
  const [calcQty, setCalcQty] = useState<number>(250);
  const [calcQuote, setCalcQuote] = useState<{
    unitPrice: number;
    total: number;
    savingsPct: number;
  }>({
    unitPrice: 199,
    total: 49750,
    savingsPct: 15,
  });

  useEffect(() => {
    // Fetch products from backend or fallback to seeded defaults
    async function loadProducts() {
      try {
        const data = await api.get("/api/products");
        if (Array.isArray(data) && data.length > 0) {
          setFeaturedProducts(data.slice(0, 6));
        } else {
          setFeaturedProducts(DEFAULT_PRODUCTS);
        }
      } catch {
        setFeaturedProducts(DEFAULT_PRODUCTS);
      }
    }
    loadProducts();
  }, []);

  // Recalculate teaser price when inputs change
  useEffect(() => {
    const areaCm2 = (calcWidth / 10) * (calcHeight / 10);
    const baseMinor = calcDivision === "race-event-numbers" ? 4500 : 3000;
    const ratePerCm2Minor = 8;
    const unitBeforeDisc = baseMinor + areaCm2 * ratePerCm2Minor;
    let disc = 0;
    if (calcQty >= 500) disc = 20;
    else if (calcQty >= 250) disc = 15;
    else if (calcQty >= 100) disc = 10;

    const unitPrice = Math.round(unitBeforeDisc * (1 - disc / 100));
    const total = unitPrice * calcQty + 5000; // 5000 paise setup fee
    setCalcQuote({ unitPrice, total, savingsPct: disc });
  }, [calcDivision, calcWidth, calcHeight, calcQty]);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      {/* 1. HERO SECTION (§5.1.1) */}
      <section className="relative overflow-hidden bg-soft-gradient pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-lavender text-deep text-xs font-semibold tracking-wide border border-line shadow-soft">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Modern Web-to-Print Engine · Pay Per Order</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-plum tracking-tight leading-[1.12]">
                Print that looks as{" "}
                <span className="text-primary underline decoration-violet/40 decoration-wavy underline-offset-8">
                  good as your idea.
                </span>
              </h1>

              <p className="text-ink-muted text-base sm:text-lg max-w-xl leading-relaxed">
                Industrial precision meets seamless digital workflows. Configure custom sizes,
                materials, and variable data with instant parametric pricing and automated print-ready proofs.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto shadow-card"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start Designing
                  </Button>
                </Link>
                <Link href="#calculator" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                    leftIcon={<Calculator className="w-4 h-4" />}
                  >
                    Get Instant Price
                  </Button>
                </Link>
              </div>

              {/* Trust Row */}
              <div className="pt-6 border-t border-line flex flex-wrap items-center gap-6 text-xs font-medium text-ink-muted">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Pay per order</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>No monthly subscription</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>300 DPI print-ready files</span>
                </div>
              </div>
            </div>

            {/* Right Sneaker-Store Showcase Hero Box (§5.1.1) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-card bg-hero-gradient p-6 sm:p-8 text-white shadow-lift border border-deep overflow-hidden">
                {/* Floating Spec Chips */}
                <div className="absolute top-4 left-4 z-20">
                  <Badge variant="primary" className="bg-white/20 text-white backdrop-blur-md border-white/20">
                    300 DPI Native
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 z-20">
                  <Badge variant="proof" className="bg-violet text-white">
                    Instant Proof
                  </Badge>
                </div>

                {/* Sneaker-Store Style Floating Graphic */}
                <div className="my-8 sm:my-10 relative flex items-center justify-center">
                  <div className="w-48 sm:w-56 h-48 sm:h-56 rounded-full bg-violet/20 blur-2xl absolute" />
                  <div className="relative z-10 w-full max-w-[260px] aspect-square rounded-card bg-surface-card p-6 shadow-card border border-white/20 flex flex-col items-center justify-center text-center transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-lavender flex items-center justify-center text-primary mb-3 shadow-soft">
                      <Printer className="w-8 h-8 sm:w-9 sm:h-9" />
                    </div>
                    <span className="font-heading font-extrabold text-base sm:text-lg text-plum">
                      Custom Die-Cut Vinyl
                    </span>
                    <span className="text-xs text-primary font-bold mt-1">
                      Waterproof · UV Laminated
                    </span>
                    <div className="mt-3 sm:mt-4 px-3 py-1 rounded-pill bg-lavender text-[11px] font-semibold text-deep">
                      From ₹2.40 / unit
                    </div>
                  </div>
                </div>

                {/* Hero Bottom Strip */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-lavender">
                  <span>Production in 2-3 business days</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    Explore Divisions <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DIVISION HUB — 6 EQUAL-WEIGHT TILES (§5.1.2) */}
      <section className="py-20 bg-lavender/30 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Specialized Divisions
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-plum tracking-tight">
              Six Purpose-Built Print Divisions
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Every division features dedicated parametric pricing, specialized material choices,
              and tailored artwork verification standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIVISIONS.map((div) => {
              const Icon = DIVISION_ICONS[div.slug] || Sparkles;
              return (
                <Link
                  key={div.slug}
                  href={`/products?division=${div.slug}`}
                  className="group rounded-card bg-surface-card p-6 border border-line shadow-soft hover:shadow-lift hover:border-primary/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-btn bg-lavender flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-soft">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-plum group-hover:text-primary transition-colors">
                        {div.name}
                      </h3>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                        {div.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-line flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. INSTANT PRICE CALCULATOR TEASER (§5.1.3) */}
      <section id="calculator" className="py-20 bg-surface-bg border-b border-line scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-card bg-surface-card border border-line shadow-card p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Live Parametric Estimator
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-plum mt-1">
                  Instant Price Calculator
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Real-time formula calculation including volume discounts and GST.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-lavender text-deep text-xs font-semibold self-start sm:self-auto">
                <Zap className="w-4 h-4 text-primary" />
                <span>Instant Calculation</span>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Division */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Division
                </label>
                <select
                  value={calcDivision}
                  onChange={(e) => setCalcDivision(e.target.value)}
                  className="w-full rounded-btn border border-line bg-surface-card p-2.5 text-xs font-semibold text-ink outline-none hover:border-lavender focus:border-primary focus:shadow-focus"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Dimensions (W × H mm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={calcWidth}
                    onChange={(e) => setCalcWidth(Number(e.target.value))}
                    min={20}
                    max={1200}
                    className="w-full min-w-0 rounded-btn border border-line bg-surface-card p-2.5 text-xs text-center font-semibold text-ink outline-none focus:border-primary"
                  />
                  <span className="text-xs text-ink-muted shrink-0">×</span>
                  <input
                    type="number"
                    value={calcHeight}
                    onChange={(e) => setCalcHeight(Number(e.target.value))}
                    min={20}
                    max={1200}
                    className="w-full min-w-0 rounded-btn border border-line bg-surface-card p-2.5 text-xs text-center font-semibold text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Quantity
                </label>
                <select
                  value={calcQty}
                  onChange={(e) => setCalcQty(Number(e.target.value))}
                  className="w-full rounded-btn border border-line bg-surface-card p-2.5 text-xs font-semibold text-ink outline-none hover:border-lavender focus:border-primary focus:shadow-focus"
                >
                  <option value={50}>50 units</option>
                  <option value={100}>100 units (10% off)</option>
                  <option value={250}>250 units (15% off)</option>
                  <option value={500}>500 units (20% off)</option>
                  <option value={1000}>1,000 units (25% off)</option>
                </select>
              </div>

              {/* Live Price Result Card */}
              <div className="bg-lavender-light rounded-btn p-4 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-muted">Estimated Total</span>
                    {calcQuote.savingsPct > 0 && (
                      <Badge variant="primary" className="text-[10px] py-0.5">
                        Save {calcQuote.savingsPct}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-heading font-extrabold text-primary tabular-nums mt-1">
                    ₹{(calcQuote.total / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-ink-muted">
                    ₹{(calcQuote.unitPrice / 100).toFixed(2)}/unit · incl. 18% GST
                  </div>
                </div>

                <Link href={`/products?division=${calcDivision}`} className="mt-3">
                  <Button variant="primary" size="sm" className="w-full text-xs">
                    Customize This
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS — 4 STEPS (§5.1.4) */}
      <section className="py-20 bg-surface-card border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Seamless Customer Journey
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-plum tracking-tight">
              How DigiVio Works
            </h2>
            <p className="text-sm text-ink-muted">
              From instant parametric pricing to digital proof approval and factory floor production.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
            {STEPS.map((step, idx) => (
              <div key={step.title} className="flex flex-col items-center text-center space-y-3 relative p-4 rounded-card bg-surface-card/60 sm:bg-transparent">
                <div className="w-12 h-12 rounded-full bg-primary text-white font-extrabold text-base flex items-center justify-center shadow-card ring-4 ring-primary/20 shrink-0">
                  {idx + 1}
                </div>
                <h3 className="font-heading font-bold text-base text-plum">{step.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED PRODUCTS (§5.1.5) */}
      <section className="py-20 bg-surface-bg border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Popular Formats
              </span>
              <h2 className="font-heading font-extrabold text-3xl text-plum mt-1">
                Featured Print Products
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              Browse entire catalogue ({featuredProducts.length}+ products) →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id || prod.slug} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. PROMOTIONAL BANNER (§5.1.6) */}
      <section className="py-12 bg-surface-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-card bg-promo-gradient p-6 sm:p-12 text-white shadow-lift flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3 py-1 rounded-pill bg-white/20 text-xs font-semibold tracking-wide">
                Volume Scaling
              </span>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl">
                Order 250+ units & automatically save up to 25%
              </h3>
              <p className="text-sm text-lavender/80 max-w-xl">
                Automatic tiered discounts calculated dynamically in real-time. No coupons or negotiation required.
              </p>
            </div>
            <Link href="/products" className="shrink-0 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto bg-white text-deep hover:bg-lavender-light border-0 shadow-card font-bold"
              >
                Explore Volume Discounts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. GALLERY PREVIEW (§5.1.7) */}
      <section className="py-20 bg-surface-card border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Factory Precision
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-plum">
              Real Work from Our Presses
            </h2>
            <p className="text-sm text-ink-muted">
              Inspect samples of die-cut stickers, Tyvek marathon bibs, and laser-cut acrylic awards.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {GALLERY_SAMPLES.map((sample, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-card overflow-hidden bg-lavender-light border border-line shadow-soft flex flex-col items-center justify-center p-4 hover:shadow-lift transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-soft mb-2 group-hover:scale-110 transition-transform">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-plum text-center">{sample.title}</span>
                <span className="text-[10px] text-ink-muted uppercase mt-0.5">{sample.division}</span>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link href="/gallery">
              <Button variant="secondary" size="md">
                View Full Showcase Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. WHY DIGIVIO (§5.1.8) */}
      <section className="py-20 bg-surface-bg border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              The DigiVio Standard
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-plum">
              Engineered for Speed & Zero Waste
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((ben) => {
              const Icon = ben.icon;
              return (
                <div
                  key={ben.title}
                  className="rounded-card bg-surface-card p-6 border border-line shadow-soft space-y-3"
                >
                  <div className="w-10 h-10 rounded-btn bg-lavender text-primary flex items-center justify-center shadow-soft">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-plum">{ben.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{ben.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA BAND (§5.1.10) */}
      <section className="py-20 bg-deep text-white border-b border-deep">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight">
            Ready to bring your print project to life?
          </h2>
          <p className="text-sm sm:text-base text-lavender/80 max-w-xl mx-auto leading-relaxed">
            Experience subscription-free web-to-print. Get instant parametric pricing and review your digital proof in minutes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link href="/products" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-lift"
              >
                Browse All Products
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const STEPS = [
  {
    title: "1. Parametric Configure",
    desc: "Specify exact millimeters, choose industrial materials, and see live debounced pricing with volume discount tiers.",
  },
  {
    title: "2. Design or Upload",
    desc: "Use our in-browser canvas designer with print-safe boundary locking or upload your finished PDF/AI artwork.",
  },
  {
    title: "3. Digital Proof & Approval",
    desc: "Inspect high-resolution trim and bleed proofs. Request changes or give final sign-off before files unlock.",
  },
  {
    title: "4. Print & Fast Delivery",
    desc: "Your job routes directly to production with certified 300 DPI vectors and trackable status updates.",
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "Instant Parametric Quotes",
    desc: "No waiting for sales reps. Get exact tax-inclusive prices down to the millimeter in under 200ms.",
  },
  {
    icon: ShieldCheck,
    title: "Print-Area Locking",
    desc: "Zero artwork trim errors. Elements outside printable trim bounds are dynamically snapped into safe zones.",
  },
  {
    icon: FileCheck,
    title: "Proof Version Audit",
    desc: "Full revision tracking (v1, v2...) ensures you only approve the latest artwork with immutable cryptographic logs.",
  },
  {
    icon: Repeat,
    title: "One-Click Reordering",
    desc: "Re-run past print batches in seconds with saved configurations, bypassing redesign cycles completely.",
  },
];

const DEFAULT_PRODUCTS: ProductSummary[] = [
  {
    id: "prod-1",
    name: "Custom Contour Labels",
    slug: "custom-contour-labels",
    division_slug: "labels-stickers",
    division_name: "Labels & Stickers",
    description: "Waterproof vinyl with precision contour die-cutting and glossy or matte UV laminate.",
    base_price_minor: 29900,
    min_width_mm: 30,
    max_width_mm: 300,
    min_height_mm: 30,
    max_height_mm: 300,
    min_qty: 50,
  },
  {
    id: "prod-2",
    name: "Tyvek Race & Event Bibs",
    slug: "tyvek-race-event-bibs",
    division_slug: "race-event-numbers",
    division_name: "Race & Event Numbers",
    description: "Tear-resistant, waterproof Tyvek with CSV variable data merge for runner names and numbers.",
    base_price_minor: 45000,
    min_width_mm: 140,
    max_width_mm: 220,
    min_height_mm: 100,
    max_height_mm: 160,
    min_qty: 100,
    supports_csv_merge: true,
  },
  {
    id: "prod-3",
    name: "Downhill MTB Number Plates",
    slug: "downhill-mtb-plates",
    division_slug: "mtb-boards",
    division_name: "MTB Boards",
    description: "Heavy-duty 500-micron polypropylene impact plates with pre-punched zip-tie slots.",
    base_price_minor: 39900,
    min_width_mm: 160,
    max_width_mm: 200,
    min_height_mm: 140,
    max_height_mm: 180,
    min_qty: 25,
  },
  {
    id: "prod-4",
    name: "Self-Inking Rubber Stamps",
    slug: "self-inking-stamps",
    division_slug: "stamps",
    division_name: "Stamps",
    description: "Micro-porous laser-engraved rubber stamps with 10,000+ crisp, smudge-free impressions.",
    base_price_minor: 59900,
    min_width_mm: 40,
    max_width_mm: 75,
    min_height_mm: 15,
    max_height_mm: 40,
    min_qty: 1,
  },
  {
    id: "prod-5",
    name: "Laser-Cut Acrylic Trophies",
    slug: "acrylic-trophies",
    division_slug: "trophies",
    division_name: "Trophies",
    description: "Custom-shaped 10mm cast acrylic with high-contrast reverse UV printing and hardwood base.",
    base_price_minor: 89900,
    min_width_mm: 100,
    max_width_mm: 200,
    min_height_mm: 150,
    max_height_mm: 300,
    min_qty: 5,
  },
  {
    id: "prod-6",
    name: "Architectural Laser Panels",
    slug: "laser-panels",
    division_slug: "laser-cut-work",
    division_name: "Laser-Cut Work",
    description: "Precision CNC laser cutting for signage, wood veneers, acrylics, and acoustic foam.",
    base_price_minor: 99900,
    min_width_mm: 200,
    max_width_mm: 1200,
    min_height_mm: 200,
    max_height_mm: 800,
    min_qty: 1,
  },
];

const GALLERY_SAMPLES = [
  { title: "Marathon Bib 2026", division: "Race & Event Numbers" },
  { title: "Holographic Vinyl Sticker", division: "Labels & Stickers" },
  { title: "Downhill Cup #42 Plate", division: "MTB Boards" },
  { title: "Certified Notary Stamp", division: "Stamps" },
  { title: "Endurance Trophy Award", division: "Trophies" },
  { title: "Backlit Retail Signage", division: "Laser-Cut Work" },
];
