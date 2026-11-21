"use client";

import React, { useState, useEffect } from "react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Download, Receipt } from "lucide-react";

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const orders = await api.get<any[]>("/api/orders");
        if (Array.isArray(orders)) {
          const paidOrders = orders.filter((o) => o.payment_status === "paid");
          setInvoices(
            paidOrders.map((o) => ({
              invoiceNo: `INV-${o.order_no || o.id}`,
              orderNo: o.order_no || o.id,
              date: new Date(o.created_at || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              amountMinor: o.total_minor || 0,
              taxMinor: o.tax_minor || 0,
              status: o.payment_status,
            }))
          );
        }
      } catch {}
    }
    fetchInvoices();
  }, []);

  const handleDownload = (orderNo: string) => {
    window.open(`/api/orders/${orderNo}/invoice`, "_blank");
  };

  return (
    <CustomerShell
      title="Tax Invoices & Receipts"
      subtitle="Download GST-compliant tax invoices for your corporate and business filings."
    >
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Order Number</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>GST Included (18%)</TableHead>
              <TableHead>Total Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">PDF Invoice</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-ink-muted">
                  No tax invoices found. Invoices are generated once payment is completed.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.invoiceNo}>
                  <TableCell className="font-mono font-bold text-plum">{inv.invoiceNo}</TableCell>
                  <TableCell className="font-mono text-ink-muted text-xs">{inv.orderNo}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{inv.date}</TableCell>
                  <TableCell className="tabular-nums text-xs">
                    ₹{(inv.taxMinor / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-heading font-bold text-primary tabular-nums">
                    ₹{(inv.amountMinor / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="completed">Settled</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(inv.orderNo)}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </CustomerShell>
  );
}
