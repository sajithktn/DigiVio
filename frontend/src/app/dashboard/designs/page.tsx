"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FolderHeart, Repeat, Edit, Trash2, Plus, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface CustomerDesign {
  id: string;
  name: string;
  product: string;
  productSlug: string;
  specs: string;
  date: string;
}

export default function SavedDesignsPage() {
  const [designs, setDesigns] = useState<CustomerDesign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [activeDesign, setActiveDesign] = useState<CustomerDesign | null>(null);
  const [newName, setNewName] = useState("");

  const fetchDesigns = async () => {
    try {
      const data = await api.get<any[]>("/api/designs");
      if (Array.isArray(data)) {
        const mapped: CustomerDesign[] = data.map((d) => ({
          id: d.id,
          name: d.name || "Untitled Artwork",
          product: d.config?.product_name || "Custom Print Job",
          productSlug: d.config?.product_slug || "labels-stickers",
          specs: d.config?.width_mm && d.config?.height_mm ? `${d.config.width_mm}×${d.config.height_mm}mm` : "Custom Size",
          date: d.created_at
            ? new Date(d.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Recent",
        }));
        setDesigns(mapped);
      }
    } catch (err) {
      console.warn("Failed to load designs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleOpenRename = (d: CustomerDesign) => {
    setActiveDesign(d);
    setNewName(d.name);
    setRenameModalOpen(true);
  };

  const handleSaveRename = async () => {
    if (!newName.trim() || !activeDesign) return;
    try {
      await api.patch(`/api/designs/${activeDesign.id}`, { name: newName.trim() });
      setDesigns((prev) =>
        prev.map((d) => (d.id === activeDesign.id ? { ...d, name: newName.trim() } : d))
      );
    } catch (err) {
      console.warn("Failed to rename design:", err);
    } finally {
      setRenameModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/designs/${id}`);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.warn("Failed to delete design:", err);
    }
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
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-muted">Loading your saved designs...</div>
        ) : designs.length > 0 ? (
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
        ) : (
          <div className="p-12 rounded-card border border-dashed border-line bg-surface-card text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mx-auto">
              <FolderHeart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-plum">No Saved Designs Yet</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Customize any product with our interactive designer or upload your vector artwork. Saved projects will appear here for fast reordering.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/products">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Design
                </Button>
              </Link>
            </div>
          </div>
        )}
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