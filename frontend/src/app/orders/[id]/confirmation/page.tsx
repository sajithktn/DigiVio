"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, FileCheck, Package, ShieldCheck } from "lucide-react";

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "DH-2026-000123";

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16 flex-1 w-full text-center space-y-8 my-auto">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto shadow-lift animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-success uppercase tracking-wider">
            Payment Settled & Order Logged
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-plum">
            Thank you! Your order is placed.
          </h1>
          <p className="text-sm text-ink-muted max-w-lg mx-auto">
            Order Reference:{" "}
            <span className="font-mono font-bold text-plum bg-lavender-light px-2.5 py-1 rounded-btn">
              {orderId}
            </span>
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-surface-card rounded-card border border-line shadow-card p-6 sm:p-8 text-left space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary shrink-0 shadow-soft">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-plum">
                Next Critical Step: Review & Approve Your Proof
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed mt-1">
                To guarantee zero printing errors, production files remain locked until you inspect and give formal approval to the digital proof.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href={`/orders/${orderId}/proof`} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-soft"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Inspect & Sign Off Proof
              </Button>
            </Link>

            <Link href="/dashboard/orders" className="text-xs font-semibold text-ink-muted hover:text-primary">
              View Order in Dashboard
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" /> Production Guaranteed
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-primary" /> Factory Tracking
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
