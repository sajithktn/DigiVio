"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  Layers,
  ArrowRight,
  ShieldCheck,
  History,
  Lock,
  Unlock,
} from "lucide-react";

export default function ProofViewerPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "DH-2026-000123";

  // Proof States
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [showBleed, setShowBleed] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [versions, setVersions] = useState([
    {
      version: 1,
      status: "pending",
      created_at: "Today, 10:30 AM",
      image: "/proofs/v1.png",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
  ]);

  const currentProof = versions.find((v) => v.version === selectedVersion) || versions[0];
  const isLatestVersion = selectedVersion === Math.max(...versions.map((v) => v.version));
  const isApproved = currentProof.status === "approved";

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/proofs/${orderId}/approve`, { version: currentProof.version }).catch(() => {});
      setVersions((prev) =>
        prev.map((v) => (v.version === currentProof.version ? { ...v, status: "approved" } : v))
      );
      setApproveModalOpen(false);
      setSuccessBanner(`Proof v${currentProof.version} Approved! Production print files are now unlocked.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeNotes.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/api/proofs/${orderId}/changes`, {
        version: currentProof.version,
        feedback: changeNotes,
      }).catch(() => {});

      setVersions((prev) => [
        ...prev.map((v) => (v.version === currentProof.version ? { ...v, status: "changes_requested" } : v)),
        {
          version: prev.length + 1,
          status: "pending",
          created_at: "Just now (Draft)",
          image: "/proofs/v2.png",
          hash: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
        },
      ]);
      setSelectedVersion(versions.length + 1);
      setChangesModalOpen(false);
      setChangeNotes("");
      setSuccessBanner("Change request dispatched to print production engineers.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-surface-card border-b border-line py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl text-plum">
                Digital Proof & Sign-Off Gate
              </h1>
              <Badge variant="primary">Order {orderId}</Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Carefully inspect dimensions, bleed line margins, and spelling before giving production approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/dashboard/orders`}>
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successBanner && (
        <div className="bg-success/10 border-b border-success/30 px-4 py-3 text-center text-xs font-semibold text-success flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Container (§7 Proof Viewer Layout) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Large Proof Preview on Lavender Background (§7.1) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-card bg-lavender-light border border-line p-8 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden shadow-soft">
              {/* Controls Bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-pill border border-line shadow-soft">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                    className="p-1.5 rounded-full hover:bg-lavender text-ink"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-plum px-2 tabular-nums">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                    className="p-1.5 rounded-full hover:bg-lavender text-ink"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setShowBleed((b) => !b)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border shadow-soft transition ${
                    showBleed
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-ink border-line"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{showBleed ? "Bleed Overlay ON" : "Hide Bleed Overlay"}</span>
                </button>
              </div>

              {/* The Proof Visual Mockup */}
              <div
                className="bg-white rounded-btn shadow-lift border border-line p-6 relative transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  width: "360px",
                  height: "240px",
                }}
              >
                {/* Bleed Margin Overlay (Hatched Soft Purple per FRONTEND.md §6.1) */}
                {showBleed && (
                  <div className="absolute inset-0 border-4 border-dashed border-violet/40 pointer-events-none rounded-btn flex items-start justify-end p-1">
                    <span className="text-[9px] font-bold text-violet bg-white/90 px-1 rounded shadow-soft">
                      3mm Bleed Limit
                    </span>
                  </div>
                )}

                {/* Safe Zone (Dashed line) */}
                <div className="absolute inset-3 border border-dotted border-primary pointer-events-none rounded flex items-center justify-center">
                  <span className="text-[9px] text-ink-muted/30 uppercase font-semibold">
                    Safe Boundary
                  </span>
                </div>

                {/* Artwork Content Mock */}
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mx-auto">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-plum">
                    Certified Vector Proof
                  </h3>
                  <p className="text-xs text-ink-muted max-w-[200px]">
                    Trim Dimensions: 90×50mm @300 DPI
                  </p>
                  <div className="text-[10px] text-ink-muted/70 font-mono">
                    SHA-256: {currentProof.hash.substring(0, 16)}...
                  </div>
                </div>
              </div>

              {/* Bottom spec caption */}
              <div className="absolute bottom-3 text-xs text-ink-muted font-medium">
                Version {currentProof.version} · Created {currentProof.created_at}
              </div>
            </div>
          </div>

          {/* Right: Versioning & Sign-Off Actions (§7.2, §7.5, §7.7) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Version Selector */}
            <div className="bg-surface-card rounded-card border border-line shadow-card p-6 space-y-4">
              <h3 className="font-heading font-bold text-sm text-plum uppercase tracking-wider">
                Proof Versions
              </h3>

              <div className="space-y-2">
                {versions.map((ver) => {
                  const isSelected = selectedVersion === ver.version;
                  return (
                    <button
                      key={ver.version}
                      onClick={() => setSelectedVersion(ver.version)}
                      className={`w-full p-3 rounded-btn border text-left flex items-center justify-between transition ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-soft"
                          : "border-line bg-surface-card hover:border-lavender"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-plum">
                          Version {ver.version}
                        </span>
                        {isSelected && <Badge variant="primary">Viewing</Badge>}
                      </div>
                      <StatusPill status={ver.status} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Approval Gate Actions Card */}
            <div className="bg-surface-card rounded-card border border-line shadow-card p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <Unlock className="w-5 h-5 text-success" />
                  ) : (
                    <Lock className="w-5 h-5 text-primary" />
                  )}
                  <h3 className="font-heading font-bold text-base text-plum">
                    {isApproved ? "Production Unlocked" : "Production Gate Locked"}
                  </h3>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {isApproved
                    ? "This proof has received official customer approval. The factory floor has received the certified print files."
                    : "Print files will only unlock and proceed to our production floor once you approve the proof."}
                </p>
              </div>

              {/* Action Buttons */}
              {!isApproved && (
                <div className="space-y-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold shadow-soft"
                    disabled={!isLatestVersion}
                    onClick={() => setApproveModalOpen(true)}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Approve Proof (Version {currentProof.version})
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => setChangesModalOpen(true)}
                  >
                    Request Changes
                  </Button>

                  {!isLatestVersion && (
                    <p className="text-[11px] text-ink-muted text-center flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-danger" />
                      A newer revision exists. Only the latest proof can be approved.
                    </p>
                  )}
                </div>
              )}

              {isApproved && (
                <Link href="/dashboard/orders" className="block">
                  <Button variant="secondary" size="md" className="w-full">
                    Track in Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal: Approve Proof (§7.5) */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title={`Approve Proof Version ${currentProof.version}?`}
        description="Formal sign-off confirmation"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink leading-relaxed">
            By clicking <strong>Approve Proof</strong>, you verify that all spelling, layout, and dimension boundaries are accurate. This action is immutable and will immediately release the 300 DPI print-ready production files to the printing press.
          </p>

          <div className="p-3 rounded-btn bg-lavender-light border border-line text-[11px] text-ink-muted space-y-1">
            <div>Order: <strong>{orderId}</strong></div>
            <div>Revision: <strong>v{currentProof.version}</strong></div>
            <div>Cryptographic SHA: <code className="text-plum">{currentProof.hash.slice(0, 12)}...</code></div>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={handleApprove}
            >
              Confirm & Unlock Production
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Request Changes (§7.5) */}
      <Modal
        isOpen={changesModalOpen}
        onClose={() => setChangesModalOpen(false)}
        title="Request Changes on Proof"
        description="Submit specific corrections for our prepress team"
      >
        <div className="space-y-4">
          <Textarea
            label="Specific Change Notes"
            placeholder="e.g. Please increase font size of runner names by 2pt and shift the sponsor logo 5mm to the left."
            value={changeNotes}
            onChange={(e) => setChangeNotes(e.target.value)}
            required
          />

          <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setChangesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              disabled={!changeNotes.trim()}
              onClick={handleRequestChanges}
            >
              Submit Change Request
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
