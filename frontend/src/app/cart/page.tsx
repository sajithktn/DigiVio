"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/context/cart-context";
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Sparkles } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalMinor, taxIncludedMinor } = useCart();

  const formattedTotal = (totalMinor / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTax = (taxIncludedMinor / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <h1 className="font-heading font-extrabold text-3xl text-plum">Your Print Cart</h1>
            <p className="text-xs text-ink-muted mt-1">
              Review your customized products and production specifications before checkout.
            </p>
          </div>

          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-danger">
              Clear All Items
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-primary" />}
            title="Your cart is empty"
            description="You haven't configured any print products yet. Explore our divisions to get instant quotes."
            actionLabel="Explore Products"
            onAction={() => router.push("/products")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-card bg-surface-card border border-line p-5 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-btn bg-lavender-light border border-line flex items-center justify-center text-primary shrink-0">
                      <Sparkles className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {item.divisionSlug.replace(/-/g, " ")}
                      </span>
                      <h3 className="font-heading font-bold text-base text-plum leading-snug">
                        {item.productName}
                      </h3>
                      <div className="text-xs text-ink-muted space-x-2">
                        <span>
                          {item.widthMm}mm × {item.heightMm}mm
                        </span>
                        {item.materialName && <span>• {item.materialName}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Price Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 flex-wrap sm:flex-nowrap w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
                    <NumberStepper
                      value={item.quantity}
                      onChange={(val) => updateQuantity(item.id, val)}
                      min={1}
                      step={25}
                    />

                    <div className="text-right">
                      <div className="text-base font-heading font-extrabold text-primary tabular-nums">
                        ₹{(item.totalMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        ₹{(item.unitPriceMinor / 100).toFixed(2)}/unit
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-btn text-ink-muted hover:text-danger hover:bg-danger/10 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary Sticky Card */}
            <div className="lg:col-span-4 rounded-card bg-surface-card border border-line shadow-card p-6 space-y-6 sticky top-24">
              <h3 className="font-heading font-bold text-lg text-plum pb-3 border-b border-line">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-ink">₹{formattedTotal}</span>
                </div>

                <div className="flex justify-between text-ink-muted">
                  <span>Included 18% GST</span>
                  <span className="tabular-nums font-medium text-ink">₹{formattedTax}</span>
                </div>

                <div className="flex justify-between text-ink-muted">
                  <span>Standard Production Shipping</span>
                  <span className="font-semibold text-success">FREE</span>
                </div>

                <div className="pt-3 border-t border-line flex justify-between text-base font-heading font-extrabold text-plum">
                  <span>Total Amount</span>
                  <span className="text-primary tabular-nums">₹{formattedTotal}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft"
                  onClick={() => router.push("/checkout")}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Checkout
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-ink-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Encrypted 256-bit checkout via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
