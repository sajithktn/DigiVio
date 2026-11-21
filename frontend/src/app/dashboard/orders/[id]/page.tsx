"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Badge, StatusPill } from "@/components/ui/badge";
import { ProgressTracker } from "@/components/ui/stepper";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import {
  FileCheck,
  Receipt,
  Repeat,
  Package,
  Calendar,
  CreditCard,
  Printer,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "DH-2026-000123";

  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  // Mock order details
  const order = {
    id: orderId,
    status: "proof", // Quote -> Order -> Artwork -> Proof -> Production -> Completed
    date: "20 Nov 2026",
    productName: "Custom Contour Labels",
    productSlug: "custom-contour-labels",
    widthMm: 90,
    heightMm: 50,
    materialName: "White Gloss Vinyl",
    quantity: 250,
    unitPriceMinor: 199,
    subtotalMinor: 49750,
    taxIncludedMinor: 7589,
    totalMinor: 49750,
    paymentStatus: "paid",
    shippingAddress: {
      fullName: "Rahul Sharma",
      addressLine1: "Plot 42, Sector 5",
      city: "Mumbai",
      postalCode: "400001",
    },
    proofVersions: [
      { version: 1, status: "pending", date: "20 Nov 2026, 10:30 AM" },
    ],
  };

  const handleReorder = async () => {
    setReorderLoading(true);
    try {
      const res = await api.post(`/api/orders/${orderId}/reorder`).catch(() => null);
      const newOrderId = res?.order_no || "DH-2026-" + Math.floor(100000 + Math.random() * 900000);
      setReorderModalOpen(false);
      router.push(`/dashboard/orders/${newOrderId}`);
    } finally {
      setReorderLoading(false);
    }
  };

  return (
    <CustomerShell
      title={`Order ${order.id}`}
      subtitle={`Placed on ${order.date} · Tracking factory pipeline`}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setReorderModalOpen(true)}
          leftIcon={<Repeat className="w-4 h-4" />}
        >
          Reorder This Job
        </Button>
      }
    >
      <div className="space-y-8">
        {/* 6-Stage Pipeline Progress Tracker Card (§8.4) */}
        <div className="p-6 rounded-card bg-surface-card border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h3 className="font-heading font-bold text-sm text-plum uppercase tracking-wider">
                Production Pipeline
              </h3>
              <p className="text-xs text-ink-muted">
                Current State: <strong className="text-primary uppercase">{order.status}</strong>
              </p>
            </div>
            <StatusPill status={order.status} />
          </div>

          <ProgressTracker currentStage={order.status} />
        </div>

        {/* Order Details & Proof Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Action Card if in proof stage */}
            {order.status === "proof" && (
              <div className="p-5 rounded-card bg-lavender-light border border-violet/30 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-violet" />
                    <h4 className="font-heading font-bold text-sm text-plum">
                      Action Required: Digital Proof Review
                    </h4>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Your proof is ready. Inspect trim lines and sign off to move this order into printing.
                  </p>
                </div>

                <Link href={`/orders/${order.id}/proof`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Review Proof
                  </Button>
                </Link>
              </div>
            )}

            {/* Specifications Card */}
            <div className="p-6 rounded-card bg-surface-card border border-line shadow-card space-y-4">
              <h3 className="font-heading font-bold text-base text-plum pb-3 border-b border-line">
                Manufacturing Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-ink-muted">Product</span>
                  <p className="font-bold text-plum mt-0.5">{order.productName}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Dimensions</span>
                  <p className="font-bold text-plum mt-0.5">{order.widthMm} × {order.heightMm} mm</p>
                </div>
                <div>
                  <span className="text-ink-muted">Material Stock</span>
                  <p className="font-bold text-plum mt-0.5">{order.materialName}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Quantity Batch</span>
                  <p className="font-bold text-plum mt-0.5 tabular-nums">{order.quantity} units</p>
                </div>
                <div>
                  <span className="text-ink-muted">Payment</span>
                  <p className="font-bold text-success mt-0.5 uppercase">Paid via Stripe</p>
                </div>
                <div>
                  <span className="text-ink-muted">Print File Gate</span>
                  <p className="font-bold text-plum mt-0.5">Awaiting Sign-off</p>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="p-6 rounded-card bg-surface-card border border-line shadow-card space-y-2 text-xs">
              <h3 className="font-heading font-bold text-sm text-plum uppercase tracking-wider pb-2 border-b border-line">
                Delivery Address
              </h3>
              <p className="font-bold text-plum">{order.shippingAddress.fullName}</p>
              <p className="text-ink-muted">{order.shippingAddress.addressLine1}</p>
              <p className="text-ink-muted">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-4 bg-surface-card rounded-card border border-line shadow-card p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-plum pb-3 border-b border-line">
              Financial Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Unit Price</span>
                <span className="tabular-nums font-medium text-ink">₹{(order.unitPriceMinor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>18% GST (inclusive)</span>
                <span className="tabular-nums font-medium text-ink">₹{(order.taxIncludedMinor / 100).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-line flex justify-between font-heading font-extrabold text-base text-plum">
                <span>Total Settled</span>
                <span className="text-primary tabular-nums">
                  ₹{(order.totalMinor / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-line space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                leftIcon={<Receipt className="w-4 h-4" />}
                onClick={() => {
                  window.open(`/api/orders/${order.id}/invoice`, "_blank");
                }}
              >
                Download Tax Invoice PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* One-Click Reorder Drawer/Modal (§8.7) */}
      <Modal
        isOpen={reorderModalOpen}
        onClose={() => setReorderModalOpen(false)}
        title="One-Click Reorder Confirmation"
        description="Repeat past batch with identical configuration"
      >
        <div className="space-y-4 text-xs">
          <p className="text-ink leading-relaxed">
            Reordering will clone this frozen configuration (<strong>{order.productName}</strong>, {order.widthMm}×{order.heightMm}mm, {order.quantity} units) and formulate an instant new order.
          </p>

          <div className="p-3 rounded-btn bg-lavender-light border border-line space-y-1">
            <div className="flex justify-between">
              <span>Current Reorder Price:</span>
              <strong className="text-primary font-heading font-bold">₹{(order.totalMinor / 100).toFixed(2)}</strong>
            </div>
            <p className="text-[10px] text-ink-muted leading-tight">
              Includes live volume tier pricing and 18% GST.
            </p>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setReorderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={reorderLoading}
              onClick={handleReorder}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Confirm Reorder
            </Button>
          </div>
        </div>
      </Modal>
    </CustomerShell>
  );
}
