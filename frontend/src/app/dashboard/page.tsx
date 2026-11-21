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
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface OrderSummary {
  id: string;
  order_no: string;
  product: string;
  qty: number;
  total: number;
  status: string;
  date: string;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOrders: 0,
    awaitingProof: 0,
    savedDesigns: 0,
    totalSpentPaise: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [pendingProofOrder, setPendingProofOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [ordersRes, designsRes] = await Promise.allSettled([
          api.get<any[]>("/api/orders"),
          api.get<any[]>("/api/designs"),
        ]);

        const rawOrders = ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value) ? ordersRes.value : [];
        const rawDesigns = designsRes.status === "fulfilled" && Array.isArray(designsRes.value) ? designsRes.value : [];

        if (!isMounted) return;

        const mappedOrders: OrderSummary[] = rawOrders.map((o) => {
          const firstItem = o.items && o.items[0];
          const productName = firstItem?.product_name || firstItem?.config?.product_name || "Custom Print Order";
          const totalQty = o.items ? o.items.reduce((acc: number, it: any) => acc + (it.qty || 0), 0) : 1;
          const totalMinor = o.total_minor || 0;

          return {
            id: o.id || o.order_no,
            order_no: o.order_no || o.id,
            product: productName,
            qty: totalQty,
            total: totalMinor,
            status: o.status || "order",
            date: o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent",
          };
        });

        const active = mappedOrders.filter((o) => !["completed", "cancelled"].includes(o.status));
        const proofOrders = mappedOrders.filter((o) => o.status === "proof");
        const totalSpent = mappedOrders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + o.total, 0);

        setStats({
          activeOrders: active.length,
          awaitingProof: proofOrders.length,
          savedDesigns: rawDesigns.length,
          totalSpentPaise: totalSpent,
        });

        setRecentOrders(mappedOrders.slice(0, 5));
        setPendingProofOrder(proofOrders[0] || null);
      } catch (err) {
        console.warn("Could not load customer dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

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
        {/* Welcome Gradient Banner */}
        <div className="rounded-card bg-hero-gradient p-6 sm:p-8 text-white shadow-lift relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-xl">
            <span className="px-2.5 py-1 rounded-pill bg-white/10 text-lavender text-xs font-semibold">
              DigiVio Workspace
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              Welcome back, {user?.full_name || "Valued Customer"}!
            </h2>
            <p className="text-xs sm:text-sm text-lavender/80 leading-relaxed">
              {stats.awaitingProof > 0 ? (
                <>
                  You have <strong>{stats.awaitingProof} proof{stats.awaitingProof > 1 ? "s" : ""} awaiting sign-off</strong>. Approve it to release certified production files to our printing floor.
                </>
              ) : stats.activeOrders > 0 ? (
                <>
                  You have <strong>{stats.activeOrders} active print order{stats.activeOrders > 1 ? "s" : ""}</strong> currently in pipeline.
                </>
              ) : (
                "Your workspace is ready. Select a product to configure dimensions, materials, and preview instant quotes."
              )}
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Orders</span>
              <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center text-primary">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-plum tabular-nums">
              {loading ? "..." : stats.activeOrders}
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
              {loading ? "..." : stats.awaitingProof}
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
              {loading ? "..." : stats.savedDesigns}
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
              {loading
                ? "..."
                : `₹${(stats.totalSpentPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`}
            </div>
          </div>
        </div>

        {/* Action Item: Needs Your Attention (Only shown if there are real proofs awaiting sign-off) */}
        {pendingProofOrder ? (
          <div className="rounded-card bg-surface-card border border-primary/30 p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-violet" />
                <h3 className="font-heading font-bold text-sm text-plum">Needs Your Attention</h3>
              </div>
              <Badge variant="proof">
                {stats.awaitingProof} Pending Action{stats.awaitingProof > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="p-4 rounded-btn bg-lavender-light border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-plum">
                  Proof Ready for Order {pendingProofOrder.order_no} ({pendingProofOrder.product})
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Prepress digital proof generated. Inspect and sign off to proceed to press.
                </p>
              </div>
              <Link href={`/orders/${pendingProofOrder.id}/proof`}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Review & Sign Off Proof
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {/* Recent Orders Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-plum">Recent Orders</h3>
            {recentOrders.length > 0 && (
              <Link href="/dashboard/orders" className="text-xs font-semibold text-primary hover:underline">
                View all orders →
              </Link>
            )}
          </div>

          {recentOrders.length > 0 ? (
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
                    <TableCell className="font-mono font-bold text-plum">{ord.order_no}</TableCell>
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
          ) : (
            <div className="p-8 rounded-card border border-dashed border-line bg-surface-card text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-plum">No Orders Placed Yet</h4>
                <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                  Ready to print? Browse our custom labels, event numbers, MTB plates, and stamps with instant pricing.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/products">
                  <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}