"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileSpreadsheet, Download, Check, AlertCircle } from "lucide-react";

export default function AdminXeroExportPage() {
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState("2026-11-30");
  const [previewInvoices, setPreviewInvoices] = useState<any[]>([]);

  const handleDownloadXeroCsv = () => {
    window.open(`/api/admin/export/xero?from=${fromDate}&to=${toDate}`, "_blank");
  };

  return (
    <AdminShell
      title="Accounting Export (Xero CSV)"
      subtitle="Generate UTF-8 BOM encoded invoices strictly for settled paid orders."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownloadXeroCsv}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Download Xero CSV
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Date Filter Bar */}
        <div className="p-5 rounded-card bg-surface-card border border-line shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-[11px] font-bold text-ink-muted uppercase">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="block mt-1 rounded-btn border border-line p-2 text-xs font-semibold text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-muted uppercase">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="block mt-1 rounded-btn border border-line p-2 text-xs font-semibold text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="text-xs text-ink-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>Strict Revenue Recognition: Excludes unpaid, cancelled, or refunded jobs.</span>
          </div>
        </div>

        {/* Preview Table */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm text-plum uppercase tracking-wider">
            Export Preview Rows ({previewInvoices.length} Settled Orders)
          </h3>

          <Table>
            <TableHeader>
              <tr>
                <TableHead>Contact Name</TableHead>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Rate (INR)</TableHead>
                <TableHead>Total (INR)</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {previewInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-ink-muted">
                    No settled invoices found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                previewInvoices.map((inv) => (
                  <TableRow key={inv.invoiceNo}>
                    <TableCell className="font-bold text-xs text-plum">{inv.contact}</TableCell>
                    <TableCell className="font-mono text-xs text-plum">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-xs text-ink-muted">{inv.date}</TableCell>
                    <TableCell className="text-xs text-ink">{inv.description}</TableCell>
                    <TableCell className="tabular-nums text-xs">{inv.qty}</TableCell>
                    <TableCell className="tabular-nums text-xs">₹{inv.unitAmount}</TableCell>
                    <TableCell className="font-heading font-bold text-primary tabular-nums text-xs">
                      ₹{inv.total}
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
