"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/badge";
import { Search, ShoppingBag, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface CustomerOrder {
  id: string;
  order_no: string;
  date: string;
  product: string;
  specs: string;
  qty: number;
  totalPaise: number;
  status: string;
}

export default function CustomerOrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchOrders() {
      try {
        const data = await api.get<any[]>("/api/orders");
        if (!isMounted) return;

        if (Array.isArray(data)) {
          const mapped: CustomerOrder[] = data.map((o) => {
            const firstItem = o.items && o.items[0];
            const productName = firstItem?.product_name || firstItem?.config?.product_name || "Custom Print Order";
            const dims = firstItem?.config ? `${firstItem.config.width_mm || 0}×${firstItem.config.height_mm || 0}mm` : "";
            const mat = firstItem?.config?.material_name || firstItem?.config?.material_id || "";
            const specs = [dims, mat].filter(Boolean).join(" · ") || "Custom configuration";
            const totalQty = o.items ? o.items.reduce((acc: number, it: any) => acc + (it.qty || 0), 0) : 1;

            return {
              id: o.id,
              order_no: o.order_no || o.id,
              date: o.created_at
                ? new Date(o.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent",
              product: productName,
              specs,
              qty: totalQty,
              totalPaise: o.total_minor || 0,
              status: o.status || "order",
            };
          });
          setOrders(mapped);
        }
      } catch (err) {
        console.warn("Failed to fetch orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filterStatus === "all" || o.status === filterStatus;
    const matchesSearch =
      o.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.product.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <CustomerShell
      title="My Print Orders"
      subtitle="Complete history of your print orders and live factory production tracking."
      actions={
        <Link href="/products">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Place New Order
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="p-4 rounded-card bg-surface-card border border-line shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {["all", "order", "artwork", "proof", "production", "completed"].map((st) => (
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
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-muted">Loading your orders...</div>
        ) : filteredOrders.length > 0 ? (
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
                  <TableCell className="font-mono font-bold text-plum">{ord.order_no}</TableCell>
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
        ) : (
          <div className="p-12 rounded-card border border-dashed border-line bg-surface-card text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-plum">No Orders Found</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                {searchQuery || filterStatus !== "all"
                  ? "No orders match your filter criteria."
                  : "You haven't placed any print orders yet. Start your first order with real-time pricing."}
              </p>
            </div>
            {!(searchQuery || filterStatus !== "all") && (
              <div className="pt-2">
                <Link href="/products">
                  <Button variant="primary" size="sm">
                    Start New Order
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}