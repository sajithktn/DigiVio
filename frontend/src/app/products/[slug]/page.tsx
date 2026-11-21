"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar, DIVISIONS } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumberStepper } from "@/components/ui/select";
import { PriceTag } from "@/components/ui/price-tag";
import { useCart } from "@/context/cart-context";
import { api } from "@/lib/api";
import { calculatePrice, validateInputs, updatePreview } from "@/lib/configurator";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  RotateCw,
  Upload,
  Palette,
  AlertCircle,
  FileCheck,
  Repeat,
  Info,
} from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  code: string;
  description: string;
  rate_multiplier: number;
}

interface OptionItem {
  id: string;
  name: string;
  code: string;
  type: string;
  choices: { label: string; value: string; price_delta_minor?: number }[];
}

interface VolumeTier {
  min_qty: number;
  discount_pct: number;
}

export default function ProductConfiguratorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "custom-contour-labels";
  const { addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);

  // Config State
  const [widthMm, setWidthMm] = useState<number>(90);
  const [heightMm, setHeightMm] = useState<number>(50);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedLamination, setSelectedLamination] = useState<string>("matte");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(100);

  // Calculated Pricing State
  const [quote, setQuote] = useState<{
    unitPriceMinor: number;
    subtotalMinor: number;
    taxIncludedMinor: number;
    totalMinor: number;
    discountPct: number;
  }>({
    unitPriceMinor: 250,
    subtotalMinor: 25000,
    taxIncludedMinor: 3814,
    totalMinor: 25000,
    discountPct: 10,
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Fetch full product configuration
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await api.get(`/api/products/${slug}`);
        if (data && data.product) {
          setProductData(data);
          const p = data.product;
          setWidthMm(p.min_width_mm || 90);
          setHeightMm(p.min_height_mm || 50);
          setQuantity(p.min_qty || 50);
          if (data.materials && data.materials.length > 0) {
            setSelectedMaterial(data.materials[0].id);
          }
          if (data.options && data.options.length > 0) {
            const initialOpts: Record<string, string> = {};
            data.options.forEach((opt: OptionItem) => {
              if (opt.choices && opt.choices.length > 0) {
                initialOpts[opt.code] = opt.choices[0].value;
              }
            });
            setSelectedOptions(initialOpts);
          }
        } else {
          // Fallback demo product
          setupFallback();
        }
      } catch {
        setupFallback();
      } finally {
        setLoading(false);
      }
    }

    function setupFallback() {
      const fb = FALLBACK_PRODUCTS[slug] || FALLBACK_PRODUCTS["custom-contour-labels"];
      setProductData(fb);
      setWidthMm(fb.product.min_width_mm || 90);
      setHeightMm(fb.product.min_height_mm || 50);
      setQuantity(fb.product.min_qty || 50);
      if (fb.materials && fb.materials.length > 0) {
        setSelectedMaterial(fb.materials[0].id);
      }
      if (fb.options && fb.options.length > 0) {
        const initialOpts: Record<string, string> = {};
        fb.options.forEach((opt: any) => {
          if (opt.choices && opt.choices.length > 0) {
            initialOpts[opt.code] = opt.choices[0].value;
          }
        });
        setSelectedOptions(initialOpts);
      }
    }

    loadProduct();
  }, [slug]);

  // Orientation toggle handler
  const handleToggleOrientation = () => {
    const nextPortrait = !isPortrait;
    setIsPortrait(nextPortrait);
    const tempW = widthMm;
    setWidthMm(heightMm);
    setHeightMm(tempW);
    // Notify preview scaffolding function
    updatePreview(heightMm, tempW, nextPortrait ? "portrait" : "landscape");
  };

  // Live Parametric Price Engine Recalculation (FRONTEND.md §5.4 & BACKEND.md Feature 5)
  useEffect(() => {
    if (!productData) return;

    const timer = setTimeout(async () => {
      try {
        const payload = {
          product_id: productData.product.id,
          width_mm: widthMm,
          height_mm: heightMm,
          qty: quantity,
          material_id: selectedMaterial || undefined,
          option_ids: Object.values(selectedOptions),
        };

        const res = await api.post("/api/pricing/quote", payload);
        if (res && res.unit_price_minor !== undefined) {
          setQuote({
            unitPriceMinor: res.unit_price_minor,
            subtotalMinor: res.subtotal_minor,
            taxIncludedMinor: res.tax_included_minor,
            totalMinor: res.total_minor,
            discountPct: res.discount_pct || 0,
          });
          return;
        }
      } catch {
        // Fallback local formula matching Feature 5 deterministic equation
      }

      // Local formula:
      // area_cm2 = (w/10) * (h/10)
      // unit_base = base_price + area_cm2 * rate_per_cm2
      const areaCm2 = (widthMm / 10) * (heightMm / 10);
      const basePrice = productData.product.base_price_minor || 29900;
      const ratePerCm2 = 8;
      const unitBase = basePrice + Math.round(areaCm2 * ratePerCm2);

      // Volume discount
      const tiers: VolumeTier[] = productData.volume_discounts || [
        { min_qty: 100, discount_pct: 10 },
        { min_qty: 250, discount_pct: 15 },
        { min_qty: 500, discount_pct: 20 },
        { min_qty: 1000, discount_pct: 25 },
      ];
      let discountPct = 0;
      const sortedTiers = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
      for (const t of sortedTiers) {
        if (quantity >= t.min_qty) {
          discountPct = t.discount_pct;
          break;
        }
      }

      const unitPriceMinor = Math.round(unitBase * (1 - discountPct / 100));
      const subtotalMinor = unitPriceMinor * quantity + 5000; // 5000 paise setup
      const taxIncludedMinor = Math.round((subtotalMinor * 0.18) / 1.18);

      setQuote({
        unitPriceMinor,
        subtotalMinor,
        taxIncludedMinor,
        totalMinor: subtotalMinor,
        discountPct,
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [widthMm, heightMm, selectedMaterial, selectedOptions, quantity, productData]);

  if (loading || !productData) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
        Loading product configurator...
      </div>
    );
  }

  const { product, materials = [], options = [], volume_discounts = [] } = productData;

  // Validation
  const isWidthValid = widthMm >= product.min_width_mm && widthMm <= product.max_width_mm;
  const isHeightValid = heightMm >= product.min_height_mm && heightMm <= product.max_height_mm;
  const isQtyValid = quantity >= product.min_qty;
  const isValidConfig = isWidthValid && isHeightValid && isQtyValid;

  const handleAddToCart = () => {
    if (!isValidConfig) return;
    const materialObj = materials.find((m: any) => m.id === selectedMaterial);

    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      divisionSlug: product.division_slug,
      widthMm,
      heightMm,
      materialId: selectedMaterial,
      materialName: materialObj?.name,
      options: selectedOptions,
      quantity,
      unitPriceMinor: quote.unitPriceMinor,
      subtotalMinor: quote.subtotalMinor,
      taxIncludedMinor: quote.taxIncludedMinor,
      totalMinor: quote.totalMinor,
    });

    setNotification("Product added to cart!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDesignOnline = () => {
    router.push(`/design/${product.slug}?w=${widthMm}&h=${heightMm}&qty=${quantity}`);
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="bg-surface-card border-b border-line py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-ink-muted">
          <Link href="/" className="hover:text-primary transition">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-primary transition">
            Products
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-plum truncate">{product.name}</span>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-plum text-white px-4 py-2.5 rounded-btn shadow-lift text-xs font-semibold flex items-center gap-2 border-l-4 border-success animate-fade-in">
          <Check className="w-4 h-4 text-success" />
          <span>{notification}</span>
          <Link href="/cart" className="underline text-lavender ml-2">
            View Cart
          </Link>
        </div>
      )}

      {/* Main Split Layout: Left Preview, Right Sticky Configurator (§5.4) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Product Visual / Interactive Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-card bg-lavender-light border border-line p-8 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden shadow-soft">
              {/* Top chips */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="primary" className="bg-white/80">
                  {product.division_name || product.division_slug}
                </Badge>
                {product.supports_csv_merge && (
                  <Badge variant="quote" className="bg-white/80">
                    CSV Merge Enabled
                  </Badge>
                )}
              </div>

              <button
                onClick={handleToggleOrientation}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-white text-ink text-xs font-semibold shadow-soft hover:bg-lavender transition border border-line"
                title="Rotate Orientation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isPortrait ? "Portrait" : "Landscape"}</span>
              </button>

              {/* Dynamic Physical Canvas Representation */}
              <div
                className="bg-white rounded-card shadow-card border-2 border-dashed border-primary/40 relative flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-300 max-w-full"
                style={{
                  width: `min(100%, ${Math.min(360, Math.max(220, (widthMm / (widthMm + heightMm)) * 520))}px)`,
                  height: `${Math.min(360, Math.max(160, (heightMm / (widthMm + heightMm)) * 520))}px`,
                }}
              >
                {/* Safe zone indicator with proper spacing preventing text overlap with central icon and title */}
                <div className="absolute inset-2 border border-dotted border-line pointer-events-none rounded-btn flex items-start justify-center pt-1.5">
                  <span className="text-[9px] text-ink-muted/50 uppercase font-semibold tracking-wider bg-white/90 px-1.5 rounded">
                    Safe Print Area
                  </span>
                </div>

                <div className="relative z-10 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center text-primary mx-auto shadow-soft">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-plum truncate max-w-[200px]">
                    {product.name}
                  </h4>
                  <p className="text-xs font-semibold text-primary tabular-nums">
                    {widthMm} mm × {heightMm} mm
                  </p>
                </div>

                {/* Bleed Tag */}
                <span className="absolute bottom-1 right-2 text-[9px] text-ink-muted/60">
                  +3mm Bleed
                </span>
              </div>

              {/* Bottom Canvas Specs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-ink-muted font-medium text-center">
                <span>300 DPI Native CMYK</span>
                <span>•</span>
                <span>Die-Cut Vector Accuracy</span>
                <span>•</span>
                <span>Automated Proofing</span>
              </div>
            </div>

            {/* Product Specifications & Trust Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-card bg-surface-card border border-line shadow-soft flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-plum">Proof Before Print</h5>
                  <p className="text-[11px] text-ink-muted">Sign-off on PDF proof</p>
                </div>
              </div>

              <div className="p-4 rounded-card bg-surface-card border border-line shadow-soft flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-plum">Industrial Grade</h5>
                  <p className="text-[11px] text-ink-muted">UV & weather-resistant</p>
                </div>
              </div>

              <div className="p-4 rounded-card bg-surface-card border border-line shadow-soft flex items-center gap-3">
                <Repeat className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-plum">Instant Reorders</h5>
                  <p className="text-[11px] text-ink-muted">Saved designs in account</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sticky Configuration Panel (§5.4) */}
          <div className="lg:col-span-5 bg-surface-card rounded-card border border-line shadow-card p-6 sm:p-8 space-y-6 sticky top-24">
            {/* 1. Title & Description */}
            <div className="space-y-1.5 pb-4 border-b border-line">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Parametric Configurator
                </span>
                <span className="text-[11px] text-ink-muted">
                  ID: {product.slug}
                </span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-plum">{product.name}</h2>
              <p className="text-xs text-ink-muted leading-relaxed">{product.description}</p>
            </div>

            {/* 2. Custom Dimensions (Width & Height mm) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Dimensions (Millimeters)
                </label>
                <span className="text-[11px] text-ink-muted">
                  Limits: {product.min_width_mm}–{product.max_width_mm}W × {product.min_height_mm}–{product.max_height_mm}H
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-ink-muted mb-1">Width (mm)</div>
                  <input
                    type="number"
                    value={widthMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWidthMm(val);
                      validateInputs(val, heightMm, quantity);
                      calculatePrice(val, heightMm, selectedMaterial, selectedLamination, quantity);
                      updatePreview(val, heightMm, isPortrait ? "portrait" : "landscape");
                    }}
                    min={product.min_width_mm}
                    max={product.max_width_mm}
                    className={`w-full min-w-0 rounded-btn border p-2.5 text-xs font-semibold tabular-nums text-ink outline-none ${
                      isWidthValid ? "border-line focus:border-primary focus:shadow-focus" : "border-danger bg-danger/5"
                    }`}
                  />
                </div>
                <div>
                  <div className="text-[11px] text-ink-muted mb-1">Height (mm)</div>
                  <input
                    type="number"
                    value={heightMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setHeightMm(val);
                      validateInputs(widthMm, val, quantity);
                      calculatePrice(widthMm, val, selectedMaterial, selectedLamination, quantity);
                      updatePreview(widthMm, val, isPortrait ? "portrait" : "landscape");
                    }}
                    min={product.min_height_mm}
                    max={product.max_height_mm}
                    className={`w-full min-w-0 rounded-btn border p-2.5 text-xs font-semibold tabular-nums text-ink outline-none ${
                      isHeightValid ? "border-line focus:border-primary focus:shadow-focus" : "border-danger bg-danger/5"
                    }`}
                  />
                </div>
              </div>

              {/* Error messages placeholder element */}
              <div id="error-messages" className="min-h-[20px]">
                {(!isWidthValid || !isHeightValid) && (
                  <p className="text-xs text-danger font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Dimensions must be within allowed bounds.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Material Selector */}
            {materials.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Select Material
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {materials.map((mat: MaterialItem) => {
                    const isSelected = selectedMaterial === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          setSelectedMaterial(mat.id);
                          calculatePrice(widthMm, heightMm, mat.id, selectedLamination, quantity);
                        }}
                        className={`p-3 rounded-btn border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-soft"
                            : "border-line bg-surface-card hover:border-lavender"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-heading font-bold text-xs text-plum">{mat.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <span className="text-[10px] text-ink-muted mt-1">{mat.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3b. Lamination / Protective Finish Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Lamination & Finish
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["matte", "gloss", "soft-touch"].map((lam) => {
                  const isSelected = selectedLamination === lam;
                  return (
                    <button
                      key={lam}
                      type="button"
                      onClick={() => {
                        setSelectedLamination(lam);
                        calculatePrice(widthMm, heightMm, selectedMaterial, lam, quantity);
                      }}
                      className={`px-3 py-2 rounded-btn text-xs font-semibold border capitalize transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-soft"
                          : "border-line bg-surface-card text-ink hover:border-lavender"
                      }`}
                    >
                      {lam.replace("-", " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Options (Finishes, etc.) */}
            {options.map((opt: OptionItem) => (
              <div key={opt.id} className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  {opt.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {opt.choices.map((choice) => {
                    const isSelected = selectedOptions[opt.code] === choice.value;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [opt.code]: choice.value }))
                        }
                        className={`px-3 py-1.5 rounded-btn text-xs font-semibold border transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-soft"
                            : "border-line bg-surface-card text-ink hover:border-lavender"
                        }`}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 5. Quantity Stepper + Quick Quantity Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ink">
                  Batch Quantity
                </label>
                <span className="text-[11px] text-ink-muted">Min {product.min_qty} units</span>
              </div>

              <div className="flex items-center gap-3">
                <NumberStepper
                  value={quantity}
                  onChange={(val) => {
                    setQuantity(val);
                    validateInputs(widthMm, heightMm, val);
                    calculatePrice(widthMm, heightMm, selectedMaterial, selectedLamination, val);
                  }}
                  min={product.min_qty || 1}
                  step={25}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[50, 100, 250, 500, 1000].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setQuantity(q);
                        validateInputs(widthMm, heightMm, q);
                        calculatePrice(widthMm, heightMm, selectedMaterial, selectedLamination, q);
                      }}
                      className={`px-2.5 py-1.5 rounded-btn text-xs font-semibold border transition ${
                        quantity === q
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line text-ink-muted hover:border-lavender"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Volume Discount Tier Table (§5.4.6) */}
            <div className="rounded-btn bg-lavender-light border border-line p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-plum">
                <span>Volume Discount Schedule</span>
                {quote.discountPct > 0 && (
                  <Badge variant="completed" className="text-[10px] py-0.5">
                    Active: {quote.discountPct}% Discount Applied
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-center">
                {[
                  { qty: 100, disc: 10 },
                  { qty: 250, disc: 15 },
                  { qty: 500, disc: 20 },
                  { qty: 1000, disc: 25 },
                ].map((tier) => {
                  const isActive = quantity >= tier.qty;
                  return (
                    <div
                      key={tier.qty}
                      className={`p-1.5 rounded-btn border transition-all ${
                        isActive
                          ? "bg-primary text-white border-primary font-bold shadow-soft"
                          : "bg-surface-card border-line text-ink-muted"
                      }`}
                    >
                      <div>{tier.qty}+</div>
                      <div>{tier.disc}% off</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Live Price Summary Block Placeholder */}
            <div
              id="live-price-display"
              data-testid="live-price-display"
              className="p-4 rounded-btn bg-surface-card border-2 border-primary/20 shadow-soft space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-muted">Unit Price</span>
                  <div className="text-sm font-bold text-plum tabular-nums">
                    ₹{(quote.unitPriceMinor / 100).toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-ink-muted">Total (incl. 18% GST)</span>
                  <div className="text-2xl font-heading font-extrabold text-primary tabular-nums">
                    ₹{(quote.totalMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Action CTAs (§5.4.8) */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-card"
                disabled={!isValidConfig}
                onClick={handleDesignOnline}
                leftIcon={<Palette className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Design in Browser
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={!isValidConfig}
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  disabled={!isValidConfig}
                  onClick={() => router.push(`/design/${product.slug}?tab=upload`)}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload Artwork
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const FALLBACK_PRODUCTS: Record<string, any> = {
  "custom-contour-labels": {
    product: {
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
    materials: [
      { id: "mat-1", name: "White Gloss Vinyl", code: "white-gloss", description: "Vibrant high-contrast finish", rate_multiplier: 1.0 },
      { id: "mat-2", name: "Matte Vinyl", code: "matte-vinyl", description: "Anti-glare velvety texture", rate_multiplier: 1.05 },
      { id: "mat-3", name: "Holographic Film", code: "holo-film", description: "Rainbow prism metallic reflection", rate_multiplier: 1.3 },
    ],
    options: [
      {
        id: "opt-1",
        name: "Lamination Finish",
        code: "lamination",
        type: "select",
        choices: [
          { label: "Standard Gloss", value: "gloss" },
          { label: "Matte Anti-Scratch", value: "matte" },
        ],
      },
    ],
  },
  "tyvek-race-event-bibs": {
    product: {
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
    materials: [
      { id: "mat-tyvek-standard", name: "Heavyweight Tyvek 75gsm", code: "tyvek-75", description: "Ultra durable, waterproof, tearproof", rate_multiplier: 1.0 },
    ],
    options: [
      {
        id: "opt-corners",
        name: "Bib Eyelets / Punching",
        code: "punching",
        type: "select",
        choices: [
          { label: "4 Corner Hole Punches", value: "4-holes" },
          { label: "No Holes", value: "none" },
        ],
      },
    ],
  },
};
