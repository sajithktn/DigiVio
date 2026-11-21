"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ORDER_STAGES } from "@/components/ui/stepper";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  Download,
  Unlock,
  Lock,
  ArrowRight,
  Kanban,
  List,
  CheckCircle2,
} from "lucide-react";

export default function AdminOrdersPipelinePage() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get<any>("/api/admin/orders");
        const list = Array.isArray(res?.orders) ? res.orders : Array.isArray(res) ? res : [];
        setOrders(
          list.map((o: any) => ({
            id: o.order_no || o.id,
            customer: o.customer_email || o.shipping_address?.email || "Customer",
            product: o.items?.[0]?.product_name || "Custom Print",
            specs: `${o.items?.[0]?.config?.width_mm || 90}×${o.items?.[0]?.config?.height_mm || 50}mm`,
            qty: o.items?.[0]?.qty || 1,
            totalPaise: o.total_minor || 0,
            status: o.status || "order",
            filesUnlocked: Boolean(o.files_unlocked),
            paymentStatus: o.payment_status || "unpaid",
          }))
        );
      } catch {}
    }
    fetchOrders();
  }, []);

  const [activeOrderForFiles, setActiveOrderForFiles] = useState<any>(null);

  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: nextStatus }).catch(() => {});
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    } catch {
      // rollback or alert
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filterStage === "all" || o.status === filterStage;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.product.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminShell
      title="Orders & Production Pipeline"
      subtitle="Advance job stages, audit proof approval locks, and download high-resolution production files."
      actions={
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-btn border border-line">
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-btn text-xs font-semibold flex items-center gap-1 ${
              viewMode === "table" ? "bg-primary text-white" : "text-ink hover:bg-lavender-light"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-1.5 rounded-btn text-xs font-semibold flex items-center gap-1 ${
              viewMode === "kanban" ? "bg-primary text-white" : "text-ink hover:bg-lavender-light"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="p-4 rounded-card bg-surface-card border border-line shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {["all", "quote", "order", "artwork", "proof", "production", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStage(st)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition ${
                  filterStage === st
                    ? "bg-primary text-white shadow-soft"
                    : "bg-lavender text-deep hover:bg-lavender-light border border-line"
                }`}
              >
                {st === "all" ? "All Stages" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order ID, email, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-btn border border-line bg-surface-card pl-9 pr-3.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* View Mode: Table (§9.2) */}
        {viewMode === "table" && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Order No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product Specs</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Production Ready</TableHead>
                <TableHead className="text-right">Staff Actions</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {filteredOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono font-bold text-plum">{ord.id}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{ord.customer}</TableCell>
                  <TableCell>
                    <div className="font-bold text-plum text-xs">{ord.product}</div>
                    <div className="text-[11px] text-ink-muted">{ord.specs}</div>
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-xs">{ord.qty}</TableCell>
                  <TableCell>
                    <StatusPill status={ord.status} />
                  </TableCell>
                  <TableCell>
                    {ord.filesUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <Unlock className="w-3.5 h-3.5" /> Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveOrderForFiles(ord)}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Files
                    </Button>

                    {ord.status === "proof" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAdvanceStatus(ord.id, "production")}
                      >
                        Advance → Production
                      </Button>
                    )}

                    {ord.status === "production" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAdvanceStatus(ord.id, "completed")}
                      >
                        Complete Job
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}

        {/* View Mode: Kanban (§9.2) */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {ORDER_STAGES.map((stg) => {
              const stageOrders = orders.filter((o) => o.status === stg.key);
              return (
                <div key={stg.key} className="rounded-card bg-surface-card border border-line p-3 space-y-3 min-w-[200px]">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <h4 className="font-heading font-bold text-xs text-plum uppercase tracking-wider">
                      {stg.label}
                    </h4>
                    <span className="px-2 py-0.5 rounded-pill bg-lavender text-[10px] font-bold text-deep">
                      {stageOrders.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stageOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-btn border border-line bg-lavender-light/40 space-y-2 shadow-soft hover:border-primary transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-plum">{ord.id}</span>
                          <span className="text-[10px] text-ink-muted">{ord.qty}u</span>
                        </div>
                        <p className="text-xs font-semibold text-plum truncate">{ord.product}</p>
                        <div className="flex items-center justify-between pt-1">
                          {ord.filesUnlocked ? (
                            <Unlock className="w-3 h-3 text-success" />
                          ) : (
                            <Lock className="w-3 h-3 text-ink-muted" />
                          )}
                          <button
                            onClick={() => setActiveOrderForFiles(ord)}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            Files
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Production Files Modal (§9.3 Hard Approval Gate) */}
      {activeOrderForFiles && (
        <Modal
          isOpen={!!activeOrderForFiles}
          onClose={() => setActiveOrderForFiles(null)}
          title={`Production Files: ${activeOrderForFiles.id}`}
          description={activeOrderForFiles.product}
        >
          <div className="space-y-4">
            {!activeOrderForFiles.filesUnlocked ? (
              <div className="p-4 rounded-btn bg-danger/10 border border-danger/20 text-xs text-danger space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> Hard Approval Gate Active
                </div>
                <p>
                  Production print-ready files cannot be downloaded until the customer reviews and formally approves the latest digital proof.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-btn bg-success/10 border border-success/20 text-xs text-success space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Unlock className="w-4 h-4" /> Files Unlocked & Verified
                </div>
                <p>
                  Customer has approved proof. High-resolution 300 DPI production files are ready for press operators.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-3 rounded-btn border border-line bg-surface-card">
                <div>
                  <div className="font-bold text-xs text-plum">300 DPI Print PDF (Trim + BleedBox)</div>
                  <div className="text-[10px] text-ink-muted">PDF/X-1a standard CMYK</div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!activeOrderForFiles.filesUnlocked}
                  onClick={() => window.open(`/api/admin/orders/${activeOrderForFiles.id}/files`, "_blank")}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-btn border border-line bg-surface-card">
                <div>
                  <div className="font-bold text-xs text-plum">Vector Prepress PNG Preview</div>
                  <div className="text-[10px] text-ink-muted">High resolution raster inspection</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!activeOrderForFiles.filesUnlocked}
                  onClick={() => window.open(`/api/admin/orders/${activeOrderForFiles.id}/download`, "_blank")}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download PNG
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setActiveOrderForFiles(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
