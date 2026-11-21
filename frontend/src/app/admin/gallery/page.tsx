"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { DIVISIONS } from "@/components/layout/navbar";
import { Image as ImageIcon, Trash2, Plus, Sparkles } from "lucide-react";

export default function AdminGalleryManagerPage() {
  const [galleryImages, setGalleryImages] = useState([
    { id: "1", title: "Marathon Bib 2026", division: "Race & Event Numbers" },
    { id: "2", title: "Holographic Vinyl Decal", division: "Labels & Stickers" },
    { id: "3", title: "Downhill Cup #42 Plate", division: "MTB Boards" },
    { id: "4", title: "Endurance Trophy Award", division: "Trophies" },
  ]);

  const handleDelete = (id: string) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <AdminShell
      title="Showcase Gallery Manager"
      subtitle="Upload press photography samples and assign them to public division galleries."
    >
      <div className="space-y-8">
        <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-sm text-plum uppercase tracking-wider">
            Upload New Press Sample
          </h3>
          <FileDropzone
            label="Upload High-Res Press Photo"
            description="Drag and drop JPEG, PNG, or WebP photography of manufactured output."
            accept="image/*"
            onFileSelect={(file) => {
              setGalleryImages((prev) => [
                ...prev,
                { id: String(Date.now()), title: file.name.replace(/\.[^/.]+$/, ""), division: "Labels & Stickers" },
              ]);
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {galleryImages.map((img) => (
            <div
              key={img.id}
              className="rounded-card bg-surface-card border border-line overflow-hidden shadow-soft flex flex-col justify-between"
            >
              <div className="aspect-square bg-lavender-light flex items-center justify-center p-4">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>

              <div className="p-3 border-t border-line flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-plum truncate max-w-[140px]">{img.title}</h4>
                  <span className="text-[10px] text-ink-muted">{img.division}</span>
                </div>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 rounded-btn text-ink-muted hover:text-danger hover:bg-danger/10 transition"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
