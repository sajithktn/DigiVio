"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FolderHeart, Repeat, Edit, Trash2, Plus, Sparkles } from "lucide-react";

export default function SavedDesignsPage() {
  const [designs, setDesigns] = useState([
    {
      id: "des-1",
      name: "Brand Logo Die-Cut Decal",
      product: "Custom Contour Labels",
      productSlug: "custom-contour-labels",
      specs: "80×80mm · Holographic Film",
      date: "Saved 3 days ago",
    },
    {
      id: "des-2",
      name: "Marathon Bib Template 2026",
      product: "Tyvek Race & Event Bibs",
      productSlug: "tyvek-race-event-bibs",
      specs: "210×148mm · 75gsm Tyvek · CSV Headers",
      date: "Saved 1 week ago",
    },
  ]);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [activeDesign, setActiveDesign] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const handleOpenRename = (d: any) => {
    setActiveDesign(d);
    setNewName(d.name);
    setRenameModalOpen(true);
  };

  const handleSaveRename = () => {
    if (!newName.trim() || !activeDesign) return;
    setDesigns((prev) =>
      prev.map((d) => (d.id === activeDesign.id ? { ...d, name: newName } : d))
    );
    setRenameModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <CustomerShell
      title="Saved Designs Gallery"
      subtitle="Your saved in-browser templates and approved production artworks."
      actions={
        <Link href="/products">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Create New Design
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div
              key={design.id}
              className="rounded-card bg-surface-card border border-line shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-card transition"
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-lavender-light border-b border-line flex flex-col items-center justify-center p-6 relative">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-primary shadow-soft mb-2">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <Badge variant="primary" className="absolute top-3 right-3 bg-white/80">
                  Ready to Reorder
                </Badge>
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-plum leading-snug">
                    {design.name}
                  </h3>
                  <p className="text-xs font-semibold text-primary">{design.product}</p>
                  <p className="text-[11px] text-ink-muted">{design.specs}</p>
                  <p className="text-[10px] text-ink-muted/70 pt-1">{design.date}</p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <Link href={`/products/${design.productSlug}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full" leftIcon={<Repeat className="w-3.5 h-3.5" />}>
                      Order
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenRename(design)}
                    aria-label="Rename design"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(design.id)}
                    className="text-danger hover:bg-danger/10"
                    aria-label="Delete design"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Rename Saved Design"
      >
        <div className="space-y-4">
          <Input
            label="Design Title"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRename}>
              Save Name
            </Button>
          </div>
        </div>
      </Modal>
    </CustomerShell>
  );
}
