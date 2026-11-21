"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar, DIVISIONS } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Eye, ArrowRight, Check, Sparkles } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  divisionSlug: string;
  divisionName: string;
  productSlug: string;
  description: string;
  specs: string;
}

export default function GalleryPage() {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  /**
   * Filter category handler.
   * Left empty with a TODO comment per instructions for user implementation.
   */
  const handleCategoryFilter = (category: string) => {
    // TODO: Implement category filtering logic
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-soft-gradient border-b border-line py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Press Showcase
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-plum tracking-tight">
            Work From Our Production Presses
          </h1>
          <p className="text-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
            Real print jobs produced with certified 300 DPI vectors, ultra-violet cured inks, and high precision laser finishing.
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => handleCategoryFilter("all")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-primary text-white shadow-soft"
            >
              All Work
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter("labels-stickers")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-surface-card text-ink hover:bg-lavender-light border border-line"
            >
              Labels & Stickers
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter("race-event-numbers")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-surface-card text-ink hover:bg-lavender-light border border-line"
            >
              Race & Event Numbers
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter("mtb-boards")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-surface-card text-ink hover:bg-lavender-light border border-line"
            >
              MTB Boards
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter("stamps")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-surface-card text-ink hover:bg-lavender-light border border-line"
            >
              Stamps
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter("trophies")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-surface-card text-ink hover:bg-lavender-light border border-line"
            >
              Trophies
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter("laser-cut-work")}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold transition bg-surface-card text-ink hover:bg-lavender-light border border-line"
            >
              Laser-Cut Work
            </button>
          </div>
        </div>
      </div>

      {/* Grid of gallery cards with data-category attributes and CSS gradient preview placeholders */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <div
              key={item.id}
              data-category={item.divisionSlug}
              onClick={() => setActiveItem(item)}
              className="group rounded-card bg-surface-card border border-line overflow-hidden shadow-soft hover:shadow-lift hover:border-primary/40 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Product Placeholder Image with Division CSS Gradient */}
              <div className="aspect-[4/3] relative flex items-center justify-center border-b border-line overflow-hidden">
                <GalleryItemPlaceholder item={item} />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-pill bg-white/90 text-[10px] font-bold text-plum backdrop-blur-sm border border-line shadow-soft z-10">
                  {item.divisionName}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-heading font-bold text-base text-plum group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-primary">
                  <span>{item.specs}</span>
                  <div className="flex items-center gap-1">
                    <span>Inspect</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Lightbox / Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={activeItem.title}
          description={activeItem.divisionName}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="aspect-video rounded-btn overflow-hidden border border-line relative flex items-center justify-center">
              <GalleryItemPlaceholder item={activeItem} />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Project Details</h4>
              <p className="text-xs text-ink-muted leading-relaxed">{activeItem.description}</p>
              <div className="pt-2 text-xs font-semibold text-primary">
                <span>Specifications: {activeItem.specs}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setActiveItem(null)}>
                Close
              </Button>
              <Link href={`/products/${activeItem.productSlug}`}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Order Something Like This
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
}

/**
 * Placeholder image component using rich local CSS gradients and vector geometry.
 * No external URLs are used.
 */
function GalleryItemPlaceholder({ item }: { item: GalleryItem }) {
  switch (item.divisionSlug) {
    case "labels-stickers":
      return (
        <div className="w-full h-full bg-gradient-to-tr from-secondary via-lavender to-primary flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/80 bg-white/30 backdrop-blur-sm flex flex-col items-center justify-center text-white shadow-soft">
            <span className="font-heading font-extrabold text-xs tracking-wider uppercase">Contour</span>
            <span className="text-[10px] opacity-90">Die-Cut</span>
          </div>
          <div className="absolute bottom-2 left-3 text-[9px] font-bold text-white/80 uppercase tracking-widest">
            Gloss Vinyl
          </div>
        </div>
      );
    case "race-event-numbers":
      return (
        <div className="w-full h-full bg-gradient-to-br from-deep via-plum to-primary flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 text-white">
          <div className="w-32 h-24 bg-white rounded-btn text-plum p-2.5 flex flex-col justify-between items-center shadow-card border border-line">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">City Marathon</span>
            <span className="font-heading font-black text-3xl tracking-tighter text-deep leading-none my-1">
              042
            </span>
            <div className="w-full flex justify-between items-center text-[7px] text-ink-muted border-t border-line/60 pt-1">
              <span>CHIP: #A89</span>
              <span>WAVE 1</span>
            </div>
          </div>
        </div>
      );
    case "mtb-boards":
      return (
        <div className="w-full h-full bg-gradient-to-br from-deep via-primary to-secondary flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 text-white">
          <div className="w-28 h-22 bg-deep border-2 border-secondary/60 rounded-btn p-3 flex flex-col items-center justify-center relative shadow-card">
            <div className="w-5 h-1 bg-white/40 rounded-full mb-1" />
            <span className="font-heading font-extrabold text-3xl text-secondary tracking-tight">77</span>
            <span className="text-[8px] font-semibold text-lavender tracking-wider uppercase mt-1">Downhill MTB</span>
          </div>
        </div>
      );
    case "stamps":
      return (
        <div className="w-full h-full bg-gradient-to-tr from-lavender-light via-lavender to-surface-card flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
          <div className="w-28 h-20 border-2 border-primary/70 rounded-card p-2 flex flex-col items-center justify-center text-primary rotate-[-3deg] bg-white/70 shadow-soft">
            <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center mb-1">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-center">Notary Public</span>
            <span className="text-[7px] text-ink-muted">Verified 2026</span>
          </div>
        </div>
      );
    case "trophies":
      return (
        <div className="w-full h-full bg-gradient-to-t from-deep via-primary to-lavender-light flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
          <div className="w-18 h-24 bg-white/25 backdrop-blur-md border border-white/60 rounded-t-card flex flex-col items-center justify-center shadow-lift text-white p-2">
            <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center mb-1">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[7px] font-extrabold uppercase tracking-widest text-center">Summit Award</span>
          </div>
          <div className="w-22 h-3 bg-deep rounded-btn mt-1 shadow-soft" />
        </div>
      );
    case "laser-cut-work":
      return (
        <div className="w-full h-full bg-gradient-to-br from-plum via-deep to-primary flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 text-white">
          <div className="w-24 h-24 border border-lavender/40 rounded-card grid grid-cols-3 grid-rows-3 gap-1 p-2 bg-white/5 backdrop-blur-xs shadow-soft">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-lavender/30 rounded-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary/80" />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full h-full bg-gradient-to-tr from-deep to-primary flex items-center justify-center text-white">
          <span className="text-xs font-bold uppercase tracking-wider">{item.divisionName}</span>
        </div>
      );
  }
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g-1",
    title: "City Marathon Elite Race Numbers",
    divisionSlug: "race-event-numbers",
    divisionName: "Race & Event Numbers",
    productSlug: "tyvek-race-event-bibs",
    description: "Printed for 12,000 marathon participants using automated variable-data CSV numbering and chip-timer barcodes.",
    specs: "Tyvek 75gsm · 210×148mm",
  },
  {
    id: "g-2",
    title: "Holographic Craft Beer Badges",
    divisionSlug: "labels-stickers",
    divisionName: "Labels & Stickers",
    productSlug: "custom-contour-labels",
    description: "Vibrant iridescent holographic vinyl stickers with scratch-proof matte over-lamination.",
    specs: "Prism Vinyl · 75×75mm Die-Cut",
  },
  {
    id: "g-3",
    title: "National Downhill Series MTB Plates",
    divisionSlug: "mtb-boards",
    divisionName: "MTB Boards",
    productSlug: "downhill-mtb-plates",
    description: "Heavy-gauge impact plastic board with high-contrast race numbers and zip-tie mounting slots.",
    specs: "Polypropylene 500μm · 180×160mm",
  },
  {
    id: "g-4",
    title: "Corporate Legal Notary Seal",
    divisionSlug: "stamps",
    divisionName: "Stamps",
    productSlug: "self-inking-stamps",
    description: "High-resolution 1000 DPI laser engraved micro-foam rubber stamp delivering crisp official impressions.",
    specs: "Self-Inking Stamp · 50×30mm",
  },
  {
    id: "g-5",
    title: "Tech Summit Innovation Award",
    divisionSlug: "trophies",
    divisionName: "Trophies",
    productSlug: "acrylic-trophies",
    description: "Custom geometric cast acrylic trophy featuring multi-layer reverse UV color printing on solid walnut timber.",
    specs: "10mm Cast Acrylic · 220×140mm",
  },
  {
    id: "g-6",
    title: "Architectural Studio Acoustic Panels",
    divisionSlug: "laser-cut-work",
    divisionName: "Laser-Cut Work",
    productSlug: "laser-panels",
    description: "Intricately patterned sound-dampening laser-cut panels designed for commercial office installations.",
    specs: "Felt & Oak Veneer · 600×600mm",
  },
];
