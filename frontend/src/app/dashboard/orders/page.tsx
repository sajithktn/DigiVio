"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/badge";
import { Search, Filter, ShoppingBag } from "lucide-react";

export default function CustomerOrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const orders = [
    {
      id: "DH-2026-000123",
      date: "20 Nov 2026",
      product: "Custom Contour Labels",
      specs: "90×50mm · White Gloss Vinyl",
      qty: 250,
      totalPaise: 49750,
      status: "proof",
    },
    {
      id: "DH-2026-000088",
      date: "18 Nov 2026",
      product: "Tyvek Race & Event Bibs",
      specs: "210×148mm · 75gsm Tyvek · CSV Merge",
      qty: 500,
      totalPaise: 99800,
      status: "production",
    },
    {
      id: "DH-2026-000045",
      date: "10 Nov 2026",
      product: "Self-Inking Rubber Stamps",
      specs: "50×30mm · Micro-foam",
      qty: 2,
      totalPaise: 119800,
      status: "completed",
    },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filterStatus === "all" || o.status === filterStatus;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.product.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <CustomerShell
      title="My Print Orders"
      subtitle="Complete history of your print orders and live factory production tracking."
      actions={
        <Link href="/products">
          <Button variant="primary" size="sm">
            Place New Order
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="p-4 rounded-card bg-surface-card border border-line shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {["all", "quote", "order", "proof", "production", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === st
                    ? "bg-primary text-white shadow-soft"
                    : "bg-lavender text-deep hover:bg-lavender-light border border-line"
                }`}
              >
                {st === "all" ? "All Orders" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ID or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-btn border border-line bg-surface-card pl-9 pr-3.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Orders Table */}
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Order Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Product & Configuration</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Total (INR)</TableHead>
              <TableHead>Production Stage</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {filteredOrders.map((ord) => (
              <TableRow key={ord.id}>
                <TableCell className="font-mono font-bold text-plum">{ord.id}</TableCell>
                <TableCell className="text-xs text-ink-muted">{ord.date}</TableCell>
                <TableCell>
                  <div className="font-bold text-plum">{ord.product}</div>
                  <div className="text-[11px] text-ink-muted">{ord.specs}</div>
                </TableCell>
                <TableCell className="tabular-nums font-semibold">{ord.qty}</TableCell>
                <TableCell className="font-heading font-bold text-primary tabular-nums">
                  ₹{(ord.totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <StatusPill status={ord.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/orders/${ord.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </CustomerShell>
  );
}
