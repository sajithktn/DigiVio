"use client";

import React from "react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Receipt } from "lucide-react";

export default function CustomerInvoicesPage() {
  const invoices = [
    {
      invoiceNo: "INV-2026-000123",
      orderNo: "DH-2026-000123",
      date: "20 Nov 2026",
      amountMinor: 49750,
      taxMinor: 7589,
      status: "paid",
    },
    {
      invoiceNo: "INV-2026-000088",
      orderNo: "DH-2026-000088",
      date: "18 Nov 2026",
      amountMinor: 99800,
      taxMinor: 15224,
      status: "paid",
    },
  ];

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
            {invoices.map((inv) => (
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
            ))}
          </tbody>
        </Table>
      </div>
    </CustomerShell>
  );
}
