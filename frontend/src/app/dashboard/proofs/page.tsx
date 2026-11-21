"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileCheck, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface ProofItem {
  orderId: string;
  product: string;
  version: number;
  status: string;
  submittedDate: string;
  actionUrl: string;
}

export default function ActiveProofsPage() {
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProofs() {
      try {
        // Try /api/proofs first, and /api/orders as fallback
        const [proofsRes, ordersRes] = await Promise.allSettled([
          api.get<any[]>("/api/proofs"),
          api.get<any[]>("/api/orders"),
        ]);

        if (!isMounted) return;

        const rawProofs = proofsRes.status === "fulfilled" && Array.isArray(proofsRes.value) ? proofsRes.value : [];
        const rawOrders = ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value) ? ordersRes.value : [];

        let items: ProofItem[] = [];

        if (rawProofs.length > 0) {
          items = rawProofs.map((p) => ({
            orderId: p.order_items?.orders?.order_no || p.order_id || p.id,
            product: p.order_items?.product_name || "Custom Print Proof",
            version: p.version || 1,
            status: p.status || "pending",
            submittedDate: p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recent",
            actionUrl: `/orders/${p.order_id || p.id}/proof`,
          }));
        } else {
          // Check orders in proof state
          const proofOrders = rawOrders.filter((o) => o.status === "proof");
          items = proofOrders.map((o) => ({
            orderId: o.order_no || o.id,
            product: o.items?.[0]?.product_name || "Custom Print Proof",
            version: 1,
            status: "pending",
            submittedDate: o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recent",
            actionUrl: `/orders/${o.id}/proof`,
          }));
        }

        setProofs(items);
      } catch (err) {
        console.warn("Could not load proofs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProofs();
    return () => {
      isMounted = false;
    };
  }, []);

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

        {loading ? (
          <div className="p-12 text-center text-xs text-ink-muted">Loading your proofs...</div>
        ) : proofs.length > 0 ? (
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
              {proofs.map((prf) => (
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
        ) : (
          <div className="p-12 rounded-card border border-dashed border-line bg-surface-card text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-plum">No Pending Proofs</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                You have no proofs awaiting approval. When you place a custom print order and our prepress team generates trim proofs, they will appear here for your review.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/products">
                <Button variant="primary" size="sm">
                  Start New Order
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}