"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { DIVISIONS } from "@/components/layout/navbar";
import { api } from "@/lib/api";
import { Plus, Edit, Trash2, Package } from "lucide-react";

export default function AdminProductsCrudPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProds() {
      try {
        const res = await api.get<any[]>("/api/products");
        if (Array.isArray(res)) {
          setProducts(
            res.map((p: any) => ({
              id: p.id || p.slug,
              name: p.name,
              division: p.division_name || p.division_slug || "Labels & Stickers",
              basePriceMinor: p.base_price_minor || 0,
              limits: `${p.min_width_mm || 20}-${p.max_width_mm || 600}W × ${p.min_height_mm || 20}-${p.max_height_mm || 600}H mm`,
              minQty: p.min_qty || 1,
              materialsCount: p.materials?.length || 0,
            }))
          );
        }
      } catch {}
    }
    fetchProds();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDivision, setNewProdDivision] = useState(DIVISIONS[0].slug);
  const [newProdBasePrice, setNewProdBasePrice] = useState(299);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const divObj = DIVISIONS.find((d) => d.slug === newProdDivision);
    const slug = newProdName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newProd = {
      name: newProdName,
      slug,
      division_slug: newProdDivision,
      base_price_minor: newProdBasePrice * 100,
      pricing_model: "area",
      min_qty: 25,
      max_qty: 10000,
      min_width_mm: 50,
      max_width_mm: 500,
      min_height_mm: 50,
      max_height_mm: 500,
      bleed_mm: 3,
      is_active: true,
    };

    try {
      await api.post("/api/admin/products", newProd).catch(() => {});
    } catch {}

    setProducts((prev) => [
      ...prev,
      {
        id: slug,
        name: newProdName,
        division: divObj?.name || "Labels & Stickers",
        basePriceMinor: newProdBasePrice * 100,
        limits: "50-500W × 50-500H mm",
        minQty: 25,
        materialsCount: 1,
      },
    ]);
    setModalOpen(false);
    setNewProdName("");
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(`/api/admin/products/${id}`).catch(() => {});
    } catch {}
    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <AdminShell
      title="Catalogue Management (CRUD)"
      subtitle="Configure products, size boundaries, material stocks, and ascending volume discount brackets without application rebuilds."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      }
    >
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Product Name</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Base Unit Price</TableHead>
              <TableHead>Allowed Dimensions</TableHead>
              <TableHead>Min Units</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-ink-muted">
                  No products found in catalogue.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-plum">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="primary">{p.division}</Badge>
                  </TableCell>
                  <TableCell className="font-heading font-semibold text-primary tabular-nums">
                    ₹{(p.basePriceMinor / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">{p.limits}</TableCell>
                  <TableCell className="tabular-nums text-xs">{p.minQty}</TableCell>
                  <TableCell className="text-xs">{p.materialsCount} stocks</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal: Add Product */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Product to Catalogue"
        description="Creates live entry across products API, configurator, and instant quote engine"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Name"
            value={newProdName}
            onChange={(e) => setNewProdName(e.target.value)}
            placeholder="e.g. Metallic Foil Sticker Decals"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">
              Division
            </label>
            <select
              value={newProdDivision}
              onChange={(e) => setNewProdDivision(e.target.value)}
              className="w-full rounded-btn border border-line p-2.5 text-xs text-ink outline-none focus:border-primary"
            >
              {DIVISIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Base Starting Price (INR)"
            type="number"
            value={newProdBasePrice}
            onChange={(e) => setNewProdBasePrice(Number(e.target.value))}
            min={10}
            required
          />

          <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
