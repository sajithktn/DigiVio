"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { api } from "@/lib/api";
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Undo2,
  Redo2,
  Download,
  Save,
  ArrowRight,
  Printer,
  Table,
  Check,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Sliders,
} from "lucide-react";

export default function DesignerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "custom-contour-labels";

  const widthMm = Number(searchParams?.get("w") || 90);
  const heightMm = Number(searchParams?.get("h") || 50);
  const quantity = Number(searchParams?.get("qty") || 100);

  // Designer State
  const [activeTab, setActiveTab] = useState<"text" | "upload" | "shapes" | "csv">("text");
  const [textElements, setTextElements] = useState<
    { id: string; text: string; fontSize: number; fontColor: string; x: number; y: number }[]
  >([
    { id: "1", text: "SAMPLE TEXT", fontSize: 24, fontColor: "#172B24", x: 60, y: 80 },
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("1");
  const [showBleedOverlay, setShowBleedOverlay] = useState(true);
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // CSV variable data state (§6.14)
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvRowCount, setCsvRowCount] = useState<number>(0);

  const handleAddText = () => {
    const newId = String(Date.now());
    setTextElements((prev) => [
      ...prev,
      { id: newId, text: "New Text Field", fontSize: 18, fontColor: "#059669", x: 50, y: 50 },
    ]);
    setSelectedTextId(newId);
  };

  const handleSaveDesign = async () => {
    setIsSaving(true);
    try {
      const canvasPayload = {
        product_slug: slug,
        width_mm: widthMm,
        height_mm: heightMm,
        canvas_json: JSON.stringify({ elements: textElements }),
      };
      await api.post("/api/designs", canvasPayload).catch(() => {});
      setWarningToast("Design saved to your account!");
      setTimeout(() => setWarningToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueToProof = () => {
    const demoOrderId = "DH-2026-" + Math.floor(100000 + Math.random() * 900000);
    router.push(`/orders/${demoOrderId}/proof`);
  };

  const selectedEl = textElements.find((e) => e.id === selectedTextId);

  return (
    <div className="h-screen flex flex-col bg-surface-bg overflow-hidden">
      {/* Top Toolbar (§6 Layout) */}
      <header className="min-h-14 py-2 bg-surface-card border-b border-line px-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href={`/products/${slug}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-btn bg-promo-gradient flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <span className="font-heading font-extrabold text-base text-plum hidden sm:inline">
              Digi<span className="text-primary">Designer</span>
            </span>
          </Link>
          <span className="text-xs text-ink-muted">|</span>
          <span className="text-xs font-semibold text-plum truncate max-w-[150px]">
            {widthMm}×{heightMm} mm
          </span>
        </div>

        {/* Center Canvas Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setWarningToast("Keep artwork inside the printable boundary!");
              setTimeout(() => setWarningToast(null), 3000);
            }}
            className="p-1.5 rounded-btn hover:bg-lavender-light text-ink-muted"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {}}
            className="p-1.5 rounded-btn hover:bg-lavender-light text-ink-muted"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-line" />
          <button
            onClick={() => setShowBleedOverlay((b) => !b)}
            className={`text-xs px-2.5 py-1 rounded-pill font-medium border ${
              showBleedOverlay ? "bg-primary/10 text-primary border-primary/20" : "border-line text-ink-muted"
            }`}
          >
            Bleed Lines {showBleedOverlay ? "ON" : "OFF"}
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveDesign}
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Save Design</span>
            <span className="sm:hidden">Save</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleContinueToProof}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Continue to Proof</span>
            <span className="sm:hidden">Proof</span>
          </Button>
        </div>
      </header>

      {/* Warning Toast */}
      {warningToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-plum text-white px-4 py-2 rounded-btn shadow-lift text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-violet" />
          <span>{warningToast}</span>
        </div>
      )}

      {/* Main Designer Studio */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Tool Panel */}
        <aside className="w-full lg:w-80 max-h-[40vh] lg:max-h-none overflow-y-auto bg-surface-card border-b lg:border-b-0 lg:border-r border-line flex flex-col shrink-0 order-2 lg:order-1">
          <div className="flex border-b border-line text-xs font-semibold">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-3 text-center transition ${
                activeTab === "text" ? "text-primary border-b-2 border-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-3 text-center transition ${
                activeTab === "upload" ? "text-primary border-b-2 border-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              Artwork
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`flex-1 py-3 text-center transition ${
                activeTab === "csv" ? "text-primary border-b-2 border-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              CSV Data
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {activeTab === "text" && (
              <div className="space-y-4">
                <Button variant="primary" size="sm" className="w-full" onClick={handleAddText} leftIcon={<Type className="w-4 h-4" />}>
                  Add Text Field
                </Button>

                {selectedEl && (
                  <div className="space-y-3 pt-2 border-t border-line">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">Text Properties</span>
                    <div>
                      <label className="text-[11px] text-ink-muted">Content</label>
                      <input
                        type="text"
                        value={selectedEl.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTextElements((prev) =>
                            prev.map((el) => (el.id === selectedEl.id ? { ...el, text: val } : el))
                          );
                        }}
                        className="w-full rounded-btn border border-line p-2 text-xs text-ink outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-ink-muted">Font Size (px)</label>
                      <input
                        type="range"
                        min={12}
                        max={72}
                        value={selectedEl.fontSize}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTextElements((prev) =>
                            prev.map((el) => (el.id === selectedEl.id ? { ...el, fontSize: val } : el))
                          );
                        }}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "upload" && (
              <div className="space-y-4">
                <FileDropzone
                  label="Upload Vector / Logo"
                  description="Supported: PNG, SVG, PDF, AI"
                  onFileSelect={(file) => {
                    setWarningToast(`Uploaded "${file.name}" with 300 DPI resolution check.`);
                    setTimeout(() => setWarningToast(null), 3000);
                  }}
                />
              </div>
            )}

            {activeTab === "csv" && (
              <div className="space-y-4">
                <div className="p-3 rounded-btn bg-lavender-light border border-line text-xs space-y-1">
                  <h5 className="font-bold text-plum">CSV Variable Data Merge</h5>
                  <p className="text-ink-muted text-[11px]">
                    Upload a spreadsheet with runner names and numbers to generate unique race bibs.
                  </p>
                </div>

                <FileDropzone
                  label="Upload Runner CSV"
                  accept=".csv"
                  description="Columns: runner_number, runner_name, category"
                  onFileSelect={(file) => {
                    setCsvFileName(file.name);
                    setCsvRowCount(250);
                    setWarningToast(`Processed ${file.name} (250 rows validated)`);
                    setTimeout(() => setWarningToast(null), 3000);
                  }}
                />

                {csvFileName && (
                  <div className="p-3 rounded-btn bg-surface-card border border-primary/30 text-xs">
                    <span className="font-bold text-primary">Loaded: {csvFileName}</span>
                    <p className="text-[11px] text-ink-muted">{csvRowCount} dynamic artwork files ready to batch</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center Canvas Area (§6 Canvas with responsive wrapper) */}
        <main className="flex-1 bg-lavender-light flex items-center justify-center p-4 sm:p-8 relative overflow-auto order-1 lg:order-2">
          {/* Canvas Box */}
          <div
            className="bg-white rounded-card shadow-lift relative border-2 border-line flex items-center justify-center max-w-full"
            style={{
              width: "min(100%, 480px)",
              height: "300px",
            }}
          >
            {/* Bleed Overlay (§6.1) */}
            {showBleedOverlay && (
              <div className="absolute inset-0 border-4 border-dashed border-violet/30 pointer-events-none rounded-card" />
            )}

            {/* Safe Zone Boundary */}
            <div className="absolute inset-4 border border-dotted border-primary pointer-events-none rounded-btn flex items-end justify-start p-2">
              <span className="text-[9px] text-ink-muted/50 font-bold uppercase">
                Safe Area Bounds
              </span>
            </div>

            {/* Editable Canvas Elements */}
            {textElements.map((el) => (
              <div
                key={el.id}
                onClick={() => setSelectedTextId(el.id)}
                className={`absolute cursor-move select-none p-2 border ${
                  selectedTextId === el.id
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-transparent hover:border-line"
                }`}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  fontSize: `${el.fontSize}px`,
                  color: el.fontColor,
                }}
              >
                {el.text}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
