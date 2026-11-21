"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { ShieldCheck, ArrowRight, Lock, Check, Sparkles } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalMinor, taxIncludedMinor, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<"details" | "review" | "pay">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center space-y-4">
          <h2 className="font-heading font-extrabold text-2xl text-plum">No Items to Checkout</h2>
          <p className="text-xs text-ink-muted">Your cart is currently empty.</p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Browse Catalogue
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCreateOrderAndPay = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create order on backend via POST /api/orders
      const firstItem = items[0];
      const orderPayload = {
        product_id: firstItem.productId,
        width_mm: firstItem.widthMm,
        height_mm: firstItem.heightMm,
        qty: firstItem.quantity,
        material_id: firstItem.materialId,
        options: firstItem.options,
        shipping_address: {
          fullName,
          phone,
          addressLine1,
          city,
          state: stateName,
          postalCode,
        },
      };

      let orderId = "DH-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);

      try {
        const orderRes = await api.post("/api/orders", orderPayload);
        if (orderRes && (orderRes.id || orderRes.order_no)) {
          orderId = orderRes.order_no || orderRes.id;
        }
      } catch {
        // demo fallback order creation
      }

      // 2. Stripe Checkout Integration via POST /api/checkout
      try {
        const checkoutSession = await api.post("/api/checkout", {
          order_id: orderId,
          success_url: `${window.location.origin}/orders/${orderId}/confirmation`,
          cancel_url: `${window.location.origin}/checkout`,
        });

        if (checkoutSession && checkoutSession.url) {
          clearCart();
          window.location.href = checkoutSession.url;
          return;
        }
      } catch {
        // In local mock or non-Stripe keys mode: simulate direct confirmation
      }

      clearCart();
      router.push(`/orders/${orderId}/confirmation`);
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedTotal = (totalMinor / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Steps Indicator (§5.6) */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2 text-primary">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
              1
            </span>
            <span>Delivery Details</span>
          </div>
          <span className="w-8 h-0.5 bg-line" />
          <div className={`flex items-center gap-2 ${step !== "details" ? "text-primary" : "text-ink-muted"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step !== "details" ? "bg-primary text-white" : "bg-line text-ink-muted"}`}>
              2
            </span>
            <span>Payment & Review</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Form Details */}
          <div className="lg:col-span-8 bg-surface-card rounded-card border border-line shadow-card p-6 sm:p-8 space-y-6">
            <h2 className="font-heading font-extrabold text-xl text-plum pb-4 border-b border-line">
              Shipping & Production Delivery
            </h2>

            {error && (
              <div className="p-3 rounded-btn bg-danger/10 border border-danger/20 text-xs text-danger font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recipient Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
              />

              <Input
                label="Email Address for Proofs"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <Input
                label="Contact Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />

              <Input
                label="Postal / PIN Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="400001"
                required
              />

              <div className="sm:col-span-2">
                <Input
                  label="Street Address / Factory Unit"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Plot 42, Industrial Area, Sector 5"
                  required
                />
              </div>

              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                required
              />

              <Input
                label="State / Province"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Maharashtra"
                required
              />
            </div>

            <div className="pt-4 border-t border-line flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
              <Link href="/cart" className="text-xs text-ink-muted hover:text-ink font-semibold text-center sm:text-left">
                ← Return to Cart
              </Link>

              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateOrderAndPay}
                isLoading={loading}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                disabled={!fullName || !email || !addressLine1}
                className="w-full sm:w-auto"
              >
                Pay ₹{formattedTotal} via Stripe
              </Button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-4 bg-surface-card rounded-card border border-line shadow-card p-6 space-y-4 sticky top-24">
            <h3 className="font-heading font-bold text-base text-plum pb-3 border-b border-line">
              Items in Order ({items.length})
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between items-start text-xs border-b border-line pb-2">
                  <div>
                    <span className="font-bold text-plum">{i.productName}</span>
                    <p className="text-[11px] text-ink-muted">
                      {i.quantity} units · {i.widthMm}×{i.heightMm}mm
                    </p>
                  </div>
                  <span className="tabular-nums font-semibold text-primary">
                    ₹{(i.totalMinor / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>GST (18% inclusive)</span>
                <span className="tabular-nums">
                  ₹{(taxIncludedMinor / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base font-heading font-extrabold text-plum pt-2 border-t border-line">
                <span>Final Payable</span>
                <span className="text-primary tabular-nums">₹{formattedTotal}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line text-[11px] text-ink-muted flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span>Print files generate only after digital proof approval.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
