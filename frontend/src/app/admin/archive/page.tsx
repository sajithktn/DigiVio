"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

export default function AdminArchivePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadArchive() {
      try {
        const res = await api.get<{ archive: any[] }>('/api/admin/archive');
        if (Array.isArray(res?.archive)) {
          setCompletedOrders(
            res.archive.map((o: any) => ({
              id: o.order_no || o.id,
              customer: o.customer_email || o.shipping_address?.email || "Customer",
              product: o.items?.[0]?.product_name || "Custom Print",
              specs: `${o.items?.[0]?.config?.width_mm || 90}×${o.items?.[0]?.config?.height_mm || 50}mm`,
              qty: o.items?.[0]?.qty || 1,
              completedDate: o.updated_at ? new Date(o.updated_at).toLocaleDateString() : "Archived",
            }))
          );
        }
      } catch {}
    }
    loadArchive();
  }, []);

  const filtered = completedOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell
      title="Completed Orders Archive"
      subtitle="Permanent zero-deletion audit archive of historic press batches and event reruns."
    >
      <div className="space-y-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search historic jobs by ID, client, or specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-btn border border-line bg-surface-card pl-9 pr-3.5 py-2 text-xs text-ink outline-none focus:border-primary"
          />
        </div>

        <Table>
          <TableHeader>
            <tr>
              <TableHead>Order No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product & Specifications</TableHead>
              <TableHead>Batch Size</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead>Archive Status</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-ink-muted">
                  No completed jobs found in the permanent archive.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-bold text-plum">{o.id}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{o.customer}</TableCell>
                  <TableCell>
                    <div className="font-bold text-xs text-plum">{o.product}</div>
                    <div className="text-[11px] text-ink-muted">{o.specs}</div>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">{o.units}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{o.completedDate}</TableCell>
                  <TableCell>
                    <Badge variant="completed">Archived Permanently</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </AdminShell>
  );
}
