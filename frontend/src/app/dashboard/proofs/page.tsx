"use client";

import React from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileCheck, ArrowRight, ShieldAlert } from "lucide-react";

export default function ActiveProofsPage() {
  const activeProofs = [
    {
      orderId: "DH-2026-000123",
      product: "Custom Contour Labels",
      version: 1,
      status: "pending",
      submittedDate: "Today, 10:30 AM",
      actionUrl: "/orders/DH-2026-000123/proof",
    },
  ];

  return (
    <CustomerShell
      title="Active Proofs & Approvals"
      subtitle="Inspect prepress digital proofs and unlock production files with your sign-off."
    >
      <div className="space-y-6">
        <div className="p-4 rounded-card bg-lavender-light border border-violet/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-violet shrink-0 mt-0.5" />
          <div className="text-xs text-ink-muted leading-relaxed">
            <strong className="text-plum">The DigiVio Zero-Error Guarantee:</strong> We do not print unapproved artwork. Reviewing and giving approval to your digital proofs ensures our high-speed presses output exact colors, dimensions, and die-lines.
          </div>
        </div>

        <Table>
          <TableHeader>
            <tr>
              <TableHead>Order ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Proof Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ready Since</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {activeProofs.map((prf) => (
              <TableRow key={prf.orderId}>
                <TableCell className="font-mono font-bold text-plum">{prf.orderId}</TableCell>
                <TableCell className="font-medium text-ink">{prf.product}</TableCell>
                <TableCell>
                  <Badge variant="primary">v{prf.version}</Badge>
                </TableCell>
                <TableCell>
                  <StatusPill status={prf.status} />
                </TableCell>
                <TableCell className="text-xs text-ink-muted">{prf.submittedDate}</TableCell>
                <TableCell className="text-right">
                  <Link href={prf.actionUrl}>
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Review Proof
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
