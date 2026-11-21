"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw, ShoppingCart } from "lucide-react";

function CheckoutCancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <main className="max-w-xl mx-auto px-4 py-16 flex-1 w-full text-center space-y-6 my-auto">
      <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mx-auto">
        <XCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-plum">
          Checkout Was Cancelled
        </h1>
        <p className="text-sm text-ink-muted">
          Your payment was not processed and no charges were made.
          {orderId && (
            <span className="block mt-1">
              Order Reference: <span className="font-mono font-bold text-plum">{orderId}</span>
            </span>
          )}
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/checkout" className="w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full font-bold" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Try Payment Again
          </Button>
        </Link>
        <Link href="/cart" className="w-full sm:w-auto">
          <Button variant="secondary" size="md" className="w-full font-semibold" leftIcon={<ShoppingCart className="w-4 h-4" />}>
            Return to Cart
          </Button>
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-ink-muted">Loading...</div>}>
        <CheckoutCancelContent />
      </Suspense>
      <Footer />
    </div>
  );
}
