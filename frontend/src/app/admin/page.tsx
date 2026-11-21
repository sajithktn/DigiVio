"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { api } from "@/lib/api";
import {
  ShoppingBag,
  TrendingUp,
  Factory,
  FileCheck,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState({
    totalOrders: 0,
    revenuePaise: 0,
    inProduction: 0,
    awaitingProof: 0,
    readyForProduction: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [repRes, ordersRes] = await Promise.allSettled([
          api.get<any>("/api/admin/reports"),
          api.get<any>("/api/admin/orders?limit=5"),
        ]);
        if (repRes.status === "fulfilled" && repRes.value) {
          const r = repRes.value;
          setKpis((prev) => ({
            ...prev,
            totalOrders: r.total_orders || 0,
            revenuePaise: r.revenue_minor || 0,
            inProduction: r.orders_by_status?.production || 0,
            awaitingProof: r.orders_by_status?.proof || 0,
          }));
        }
        if (ordersRes.status === "fulfilled" && ordersRes.value) {
          const ordList = Array.isArray(ordersRes.value?.orders)
            ? ordersRes.value.orders
            : Array.isArray(ordersRes.value)
            ? ordersRes.value
            : [];
          setRecentOrders(
            ordList.map((o: any) => ({
              id: o.order_no || o.id,
              customer: o.customer_email || o.shipping_address?.email || "Customer",
              product: o.items?.[0]?.product_name || "Custom Print",
              qty: o.items?.[0]?.qty || 1,
              totalPaise: o.total_minor || 0,
              status: o.status || "order",
              readyForProduction: Boolean(o.ready_for_production),
            }))
          );
        }
      } catch {}
    }
    loadData();
  }, []);

  return (
    <AdminShell
      title="Production Operations Overview"
      subtitle="Live press queue, revenue metrics, and factory throughput."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/accounting">
            <Button variant="secondary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
              Export Xero CSV
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="primary" size="sm">
              Manage Pipeline
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* KPI Cards (§9.1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Total Realized Revenue
            </span>
            <div className="text-2xl font-heading font-extrabold text-primary tabular-nums">
              ₹{(kpis.revenuePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-success font-semibold">Excludes unpaid & cancelled</p>
          </div>

          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Orders In Production
            </span>
            <div className="text-2xl font-heading font-extrabold text-plum tabular-nums">
              {kpis.inProduction}
            </div>
            <p className="text-[11px] text-ink-muted">Active on press floor</p>
          </div>

          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Awaiting Customer Sign-off
            </span>
            <div className="text-2xl font-heading font-extrabold text-violet tabular-nums">
              {kpis.awaitingProof}
            </div>
            <p className="text-[11px] text-ink-muted">Proof approval pending</p>
          </div>

          <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Files Unlocked & Paid
            </span>
            <div className="text-2xl font-heading font-extrabold text-success tabular-nums">
              {kpis.readyForProduction}
            </div>
            <p className="text-[11px] text-success font-semibold">Ready to print</p>
          </div>
        </div>

        {/* Division Throughput Bar Chart Mockup (Purples only per FRONTEND.md §9.1) */}
        <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-plum">
              Throughput By Print Division
            </h3>
            <span className="text-xs text-ink-muted">Total 142 Jobs</span>
          </div>

          <div className="space-y-3">
            {[
              { division: "Labels & Stickers", count: 48, pct: 34, color: "bg-primary" },
              { division: "Race & Event Numbers", count: 42, pct: 30, color: "bg-violet" },
              { division: "MTB Boards", count: 22, pct: 15, color: "bg-deep" },
              { division: "Stamps", count: 14, pct: 10, color: "bg-lavender" },
              { division: "Trophies", count: 10, pct: 7, color: "bg-primary" },
              { division: "Laser-Cut Work", count: 6, pct: 4, color: "bg-violet" },
            ].map((d) => (
              <div key={d.division} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-plum">
                  <span>{d.division}</span>
                  <span className="text-ink-muted tabular-nums">
                    {d.count} jobs ({d.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-pill bg-lavender-light overflow-hidden">
                  <div className={`h-full rounded-pill ${d.color}`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-plum">Live Job Queue</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              View All Pipeline Jobs →
            </Link>
          </div>

          <Table>
            <TableHeader>
              <tr>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Ready to Print</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-ink-muted">
                    No active orders found in the production pipeline.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono font-bold text-plum">{ord.id}</TableCell>
                    <TableCell className="text-xs text-ink-muted">{ord.customer}</TableCell>
                    <TableCell className="font-medium text-xs text-plum">{ord.product}</TableCell>
                    <TableCell className="tabular-nums text-xs">{ord.qty}</TableCell>
                    <TableCell>
                      <StatusPill status={ord.status} />
                    </TableCell>
                    <TableCell>
                      {ord.readyForProduction ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                          <Unlock className="w-3.5 h-3.5" /> Files Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                          <Lock className="w-3.5 h-3.5" /> Awaiting Approval
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/orders`}>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}
