"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import {
  ShoppingBag,
  FileCheck,
  FolderHeart,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Plus,
  Repeat,
  Sparkles,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeOrders: 2,
    awaitingProof: 1,
    savedDesigns: 4,
    totalSpentPaise: 1495000,
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      id: "DH-2026-000123",
      product: "Custom Contour Labels",
      qty: 250,
      total: 49750,
      status: "proof",
      date: "Today",
    },
    {
      id: "DH-2026-000088",
      product: "Tyvek Race & Event Bibs",
      qty: 500,
      total: 99800,
      status: "production",
      date: "Yesterday",
    },
  ]);

  return (
    <CustomerShell
      title="Customer Workspace"
      subtitle="Track your active print orders, approve proofs, and reorder past batches."
      actions={
        <Link href="/products">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            New Print Order
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Welcome Gradient Banner (§4.2 / §8.1) */}
        <div className="rounded-card bg-hero-gradient p-6 sm:p-8 text-white shadow-lift relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-xl">
            <span className="px-2.5 py-1 rounded-pill bg-white/10 text-lavender text-xs font-semibold">
              DigiVio Workspace
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              Welcome back, {user?.full_name || "Valued Customer"}!
            </h2>
            <p className="text-xs sm:text-sm text-lavender/80 leading-relaxed">
              You have <strong>1 proof awaiting sign-off</strong>. Approve it to release certified production files to our printing floor.
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards (§8.1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Orders</span>
              <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center text-primary">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-plum tabular-nums">
              {stats.activeOrders}
            </div>
          </div>

          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Proof</span>
              <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center text-violet">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-violet tabular-nums">
              {stats.awaitingProof}
            </div>
          </div>

          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Saved Designs</span>
              <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center text-primary">
                <FolderHeart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-plum tabular-nums">
              {stats.savedDesigns}
            </div>
          </div>

          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
              <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center text-primary">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-primary tabular-nums">
              ₹{(stats.totalSpentPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Action Item: Needs Your Attention (§8.1) */}
        <div className="rounded-card bg-surface-card border border-primary/30 p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-violet" />
              <h3 className="font-heading font-bold text-sm text-plum">Needs Your Attention</h3>
            </div>
            <Badge variant="proof">1 Pending Action</Badge>
          </div>

          <div className="p-4 rounded-btn bg-lavender-light border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-plum">
                Proof Ready for Order DH-2026-000123 (Custom Contour Labels)
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Version 1 generated with certified 300 DPI trim guides.
              </p>
            </div>
            <Link href="/orders/DH-2026-000123/proof">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Review & Sign Off Proof
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Orders Table (§8.1) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-plum">Recent Orders</h3>
            <Link href="/dashboard/orders" className="text-xs font-semibold text-primary hover:underline">
              View all orders →
            </Link>
          </div>

          <Table>
            <TableHeader>
              <tr>
                <TableHead>Order No.</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total (INR)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {recentOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono font-bold text-plum">{ord.id}</TableCell>
                  <TableCell className="font-medium">{ord.product}</TableCell>
                  <TableCell className="tabular-nums">{ord.qty} units</TableCell>
                  <TableCell className="font-semibold tabular-nums text-primary">
                    ₹{(ord.total / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={ord.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/orders/${ord.id}`}>
                      <Button variant="ghost" size="sm">
                        Track Order
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </CustomerShell>
  );
}
