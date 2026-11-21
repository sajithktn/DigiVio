"use client";

import React from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BarChart3, TrendingUp, Download } from "lucide-react";

export default function AdminReportsPage() {
  const metrics = {
    grossRevenuePaise: 42890000,
    settledOrders: 142,
    avgOrderValuePaise: 302042,
  };

  const topProducts = [
    { name: "Custom Contour Labels", division: "Labels & Stickers", orders: 48, revenue: 1432800 },
    { name: "Tyvek Race & Event Bibs", division: "Race & Event Numbers", orders: 42, revenue: 1890000 },
    { name: "Downhill MTB Number Plates", division: "MTB Boards", orders: 22, revenue: 877800 },
    { name: "Self-Inking Rubber Stamps", division: "Stamps", orders: 14, revenue: 838600 },
  ];

  return (
    <AdminShell
      title="Reports & Analytics"
      subtitle="Financial series and manufacturing throughput analytics."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.open("/api/admin/reports?export=csv", "_blank")}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Summary
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Settled Revenue
            </span>
            <div className="text-3xl font-heading font-extrabold text-primary tabular-nums">
              ₹{(metrics.grossRevenuePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-ink-muted">Net 18% GST accounted</p>
          </div>

          <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Completed Print Jobs
            </span>
            <div className="text-3xl font-heading font-extrabold text-plum tabular-nums">
              {metrics.settledOrders}
            </div>
            <p className="text-[11px] text-ink-muted">100% throughput delivery</p>
          </div>

          <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-1">
            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">
              Average Order Value
            </span>
            <div className="text-3xl font-heading font-extrabold text-violet tabular-nums">
              ₹{(metrics.avgOrderValuePaise / 100).toFixed(0)}
            </div>
            <p className="text-[11px] text-ink-muted">Per production batch</p>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-base text-plum">Top Products by Revenue</h3>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Product</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">Total Revenue (INR)</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {topProducts.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-bold text-xs text-plum">{p.name}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{p.division}</TableCell>
                  <TableCell className="tabular-nums text-xs">{p.orders} batches</TableCell>
                  <TableCell className="font-heading font-bold text-primary tabular-nums text-xs text-right">
                    ₹{(p.revenue / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}
